import { promises as fs } from "fs";
import path from "path";
import { DonationInput, DonationItem, DonorInput, DonorProfile, ItemStatus, WeeklyNeeds } from "@/lib/types";
import { appraiseDonationItem, generateBuyerStories } from "@/lib/gemini";
import { generateItemQrCodeDataUrl } from "@/lib/qr";
import { toTitleCase } from "@/lib/utils";
import { buildDonorImpactMessage } from "@/lib/impact";
import { buildFallbackBuyerStory } from "@/lib/item-journey";

const dataDir = path.join(process.cwd(), "data");
const itemsFile = path.join(dataDir, "items.json");
const configuredStorageMode = process.env.DONATESMART_STORAGE_MODE;

interface ItemStore {
  donors: DonorProfile[];
  items: DonationItem[];
  weeklyNeeds: WeeklyNeeds;
}

const defaultWeeklyNeeds: WeeklyNeeds = {
  categories: ["Winter coats", "Men's shoes", "Children's books"],
  updatedAt: "2026-04-19T00:00:00.000Z"
};

function getDefaultStore(): ItemStore {
  return {
    donors: [],
    items: [],
    weeklyNeeds: defaultWeeklyNeeds
  };
}

function resolveStorageMode() {
  if (configuredStorageMode === "file" || configuredStorageMode === "memory") {
    return configuredStorageMode;
  }

  return process.env.VERCEL ? "memory" : "file";
}

function getGlobalStore() {
  return globalThis as typeof globalThis & {
    __donatesmartStore?: ItemStore;
  };
}

function normalizeStore(parsed: Partial<ItemStore>): ItemStore {
  return {
    donors: parsed.donors ?? [],
    items: parsed.items ?? [],
    weeklyNeeds: normalizeWeeklyNeeds(parsed.weeklyNeeds)
  };
}

function isReadonlyFilesystemError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EROFS" || error.code === "EPERM" || error.code === "EACCES")
  );
}

async function ensureFileStore() {
  try {
    await fs.access(itemsFile);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      itemsFile,
      JSON.stringify(getDefaultStore(), null, 2),
      "utf8"
    );
  }
}

function normalizeWeeklyNeeds(input?: Partial<WeeklyNeeds> | null): WeeklyNeeds {
  const categories = Array.from(
    new Set(
      (input?.categories ?? [])
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 6)
    )
  );

  return {
    categories: categories.length > 0 ? categories : defaultWeeklyNeeds.categories,
    updatedAt: input?.updatedAt || defaultWeeklyNeeds.updatedAt
  };
}

async function readStoreFromFile() {
  await ensureFileStore();
  const raw = await fs.readFile(itemsFile, "utf8");
  return normalizeStore(JSON.parse(raw) as Partial<ItemStore>);
}

async function readStoreFromMemory() {
  const globalStore = getGlobalStore();

  if (!globalStore.__donatesmartStore) {
    try {
      globalStore.__donatesmartStore = await readStoreFromFile();
    } catch {
      globalStore.__donatesmartStore = getDefaultStore();
    }
  }

  return globalStore.__donatesmartStore;
}

async function writeStoreToMemory(store: ItemStore) {
  getGlobalStore().__donatesmartStore = store;
}

async function readStore(): Promise<ItemStore> {
  if (resolveStorageMode() === "memory") {
    return readStoreFromMemory();
  }

  return readStoreFromFile();
}

async function writeStore(store: ItemStore) {
  if (resolveStorageMode() === "memory") {
    await writeStoreToMemory(store);
    return;
  }

  try {
    await fs.writeFile(itemsFile, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    if (!isReadonlyFilesystemError(error)) {
      throw error;
    }

    console.warn(
      "DonateSmart storage switched to in-memory mode because the deployment filesystem is read-only."
    );
    await writeStoreToMemory(store);
  }
}

function createItemId() {
  return `itm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createQrCodeId(existingItems: DonationItem[]) {
  let qrCodeId = "";

  do {
    qrCodeId = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existingItems.some((item) => item.qrCodeId === qrCodeId));

  return qrCodeId;
}

function createDonorId() {
  return `donor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  );
}

const displayStatusPriority: Record<ItemStatus, number> = {
  sold: 6,
  "ready-for-floor": 5,
  approved: 4,
  received: 3,
  "waiting-approval": 2,
  submitted: 1
};

function normalizeDisplayText(value?: string) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getDisplayDedupKey(item: DonationItem) {
  return [
    normalizeDisplayText(item.itemName),
    normalizeDisplayText(item.brand),
    item.category,
    item.imageDataUrl.slice(0, 80)
  ].join("|");
}

function isPreferredDisplayItem(candidate: DonationItem, current: DonationItem) {
  const priorityDelta = displayStatusPriority[candidate.status] - displayStatusPriority[current.status];

  if (priorityDelta !== 0) {
    return priorityDelta > 0;
  }

  return candidate.createdAt > current.createdAt;
}

export function dedupeItemsForDisplay(items: DonationItem[]) {
  const deduped = new Map<string, DonationItem>();

  for (const item of items) {
    const key = getDisplayDedupKey(item);
    const existing = deduped.get(key);

    if (!existing || isPreferredDisplayItem(item, existing)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function ensureBuyerStories(store: ItemStore, itemIds: string[]) {
  const targets = store.items.filter((item) => itemIds.includes(item.id));
  const itemsNeedingStories = targets.filter((item) => !item.buyerStory || item.buyerStory.model === "fallback-local");

  if (itemsNeedingStories.length === 0) {
    return;
  }

  let generatedStories: Record<string, DonationItem["buyerStory"]> = {};

  if (process.env.GEMINI_API_KEY) {
    try {
      generatedStories = await generateBuyerStories(itemsNeedingStories);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Gemini story generation failure.";
      console.error("Gemini buyer stories failed:", message);
    }
  }

  let hasChanges = false;

  for (const item of itemsNeedingStories) {
    const generatedStory = generatedStories[item.id];

    if (generatedStory) {
      item.buyerStory = generatedStory;
      hasChanges = true;
      continue;
    }

    if (!item.buyerStory) {
      item.buyerStory = buildFallbackBuyerStory(item);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    await writeStore(store);
  }
}

export async function getAllItems() {
  const store = await readStore();
  return store.items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getWeeklyNeeds() {
  const store = await readStore();
  return store.weeklyNeeds;
}

export async function updateWeeklyNeeds(categories: string[]) {
  const store = await readStore();

  store.weeklyNeeds = normalizeWeeklyNeeds({
    categories,
    updatedAt: new Date().toISOString()
  });

  await writeStore(store);
  return store.weeklyNeeds;
}

export async function getInventoryItems() {
  const store = await readStore();
  return dedupeItemsForDisplay(store.items);
}

export async function getShopItems() {
  const store = await readStore();
  const visibleItems = dedupeItemsForDisplay(store.items);

  await ensureBuyerStories(
    store,
    visibleItems.map((item) => item.id)
  );

  return dedupeItemsForDisplay(store.items);
}

export async function getItemById(id: string) {
  const store = await readStore();
  return store.items.find((item) => item.id === id) ?? null;
}

export async function getItemByQrCodeId(qrCodeId: string) {
  const store = await readStore();
  return store.items.find((item) => item.qrCodeId === qrCodeId) ?? null;
}

export async function getShopItemById(id: string) {
  const store = await readStore();
  const item = store.items.find((entry) => entry.id === id);

  if (!item) {
    return null;
  }

  await ensureBuyerStories(store, [id]);
  return store.items.find((entry) => entry.id === id) ?? item;
}

export async function getDonorById(id: string) {
  const store = await readStore();
  return store.donors.find((donor) => donor.id === id) ?? null;
}

export async function getItemsByDonorId(donorId: string) {
  const store = await readStore();
  return store.items
    .filter((item) => item.donorId === donorId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createOrUpdateDonor(input: DonorInput, donorId?: string) {
  const store = await readStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPhone = input.phone.replace(/\D/g, "");

  const existingDonor =
    (donorId ? store.donors.find((donor) => donor.id === donorId) : null) ||
    store.donors.find(
      (donor) =>
        donor.email.trim().toLowerCase() === normalizedEmail ||
        donor.phone.replace(/\D/g, "") === normalizedPhone
    );

  if (existingDonor) {
    existingDonor.name = input.name.trim();
    existingDonor.email = input.email.trim();
    existingDonor.phone = input.phone.trim();
    existingDonor.updatedAt = new Date().toISOString();
    await writeStore(store);
    return existingDonor;
  }

  const donor: DonorProfile = {
    id: createDonorId(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    totalLoyaltyPoints: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.donors.unshift(donor);
  await writeStore(store);
  return donor;
}

export async function createDonationItem(
  input: DonationInput,
  donor?: DonorProfile | null,
  options?: { isAnonymousDonation?: boolean }
) {
  const store = await readStore();
  const existingAppraisalMatch = store.items.find(
    (item) =>
      item.itemName.trim().toLowerCase() === input.itemName.trim().toLowerCase() &&
      item.category === input.category &&
      Boolean(item.isBulkClothing) === Boolean(input.isBulkClothing) &&
      (item.bulkClothingRange || "") === (input.bulkClothingRange || "") &&
      item.condition === input.condition &&
      (item.brand || "").trim().toLowerCase() === (input.brand || "").trim().toLowerCase() &&
      (item.size || "").trim().toLowerCase() === (input.size || "").trim().toLowerCase() &&
      (item.description || "").trim() === (input.description || "").trim() &&
      item.imageDataUrl === input.imageDataUrl
  );

  const pricing = existingAppraisalMatch
    ? {
        suggestedResaleRange: existingAppraisalMatch.suggestedResaleRange,
        appraisal: existingAppraisalMatch.appraisal
      }
    : await appraiseDonationItem(input);
  const id = createItemId();
  const qrCodeId = createQrCodeId(store.items);
  const itemUrl = `${resolveBaseUrl()}/items/${id}`;
  const qrCodeDataUrl = await generateItemQrCodeDataUrl(itemUrl, [
    `QR Code ID: ${qrCodeId}`,
    `Category: ${toTitleCase(input.category)}`,
    `Condition: ${toTitleCase(input.condition)}`
  ]);
  const isAnonymousDonation = Boolean(options?.isAnonymousDonation);
  const loyaltyPointsAwarded = isAnonymousDonation
    ? 0
    : Math.max(1, Math.round(pricing.suggestedResaleRange.low * 0.1));

  // AI image analysis hook:
  // Gemini now evaluates the uploaded image for pricing. A future agent/model can
  // replace or extend this call to classify the item more deeply or add richer comps.
  const item: DonationItem = {
    id,
    qrCodeId,
    donorId: donor?.id ?? null,
    isAnonymousDonation,
    createdAt: new Date().toISOString(),
    status: "waiting-approval",
    qrCodeDataUrl,
    suggestedResaleRange: pricing.suggestedResaleRange,
    loyaltyPointsAwarded,
    donorImpactMessage: buildDonorImpactMessage(input),
    appraisal: pricing.appraisal,
    ...input
  };

  store.items.unshift(item);
  await writeStore(store);
  return item;
}

export async function approveDonationItem(id: string) {
  const store = await readStore();
  const item = store.items.find((entry) => entry.id === id);

  if (!item) {
    return null;
  }

  if (item.status === "sold" || item.status === "approved" || item.status === "ready-for-floor") {
    return item;
  }

  item.status = "approved";
  item.approvedAt = new Date().toISOString();

  const donor = item.donorId ? store.donors.find((entry) => entry.id === item.donorId) : null;
  if (donor && !item.isAnonymousDonation) {
    donor.totalLoyaltyPoints += item.loyaltyPointsAwarded;
    donor.updatedAt = new Date().toISOString();
  }

  await writeStore(store);
  return item;
}

export async function markDonationItemAsSold(id: string, soldPrice: number) {
  const store = await readStore();
  const item = store.items.find((entry) => entry.id === id);

  if (!item) {
    return null;
  }

  item.status = "sold";
  item.soldAt = new Date().toISOString();
  item.soldPrice = soldPrice;

  await writeStore(store);
  return item;
}
