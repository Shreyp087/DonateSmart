import Link from "next/link";
import { DonationItem } from "@/lib/types";
import {
  getBuyerJourneySteps,
  getBuyerStory,
  getBuyerStoryClosing,
  getShopAvailabilityLabel,
  getShopAvailabilityTone,
  getStatusToneClass
} from "@/lib/item-journey";
import { DetailImagePanel } from "@/components/ui/detail-image-panel";
import { formatCurrency, toTitleCase } from "@/lib/utils";

const pickupWindows = {
  today: {
    label: "Today after 5",
    note: "Good for a quick same-day handoff."
  },
  tomorrow: {
    label: "Tomorrow",
    note: "A simple next-day pickup keeps it easy."
  },
  weekend: {
    label: "Weekend",
    note: "Best if you want a softer, more relaxed pickup plan."
  }
} as const;

type PickupWindow = keyof typeof pickupWindows;

function buildModeHref(itemId: string, mode?: "buy" | "pickup", slot?: PickupWindow, confirmed?: boolean) {
  const params = new URLSearchParams();

  if (mode) {
    params.set("mode", mode);
  }

  if (slot) {
    params.set("slot", slot);
  }

  if (confirmed) {
    params.set("confirmed", "1");
  }

  const query = params.toString();
  return query ? `/shop/${itemId}?${query}` : `/shop/${itemId}`;
}

export function ShopItemStory({
  item,
  mode,
  slot,
  confirmed
}: {
  item: DonationItem;
  mode?: "buy" | "pickup";
  slot?: PickupWindow;
  confirmed?: boolean;
}) {
  const story = getBuyerStory(item);
  const steps = getBuyerJourneySteps(item, mode);
  const availability = getShopAvailabilityLabel(item);
  const tone = getShopAvailabilityTone(item);
  const canBuy = ["approved", "ready-for-floor"].includes(item.status);
  const canSchedulePickup = item.status !== "sold";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
      <DetailImagePanel src={item.imageDataUrl} alt={item.itemName} className="min-h-[380px] lg:min-h-[560px]" />

      <div className="space-y-6 rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusToneClass(tone)}`}
          >
            {availability}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {toTitleCase(item.category)}
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage-700">Buyer Story</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{story.title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{story.detail}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoTile
            label={item.status === "sold" && item.soldPrice ? "Final sale" : "Suggested range"}
            value={
              item.status === "sold" && item.soldPrice
                ? formatCurrency(item.soldPrice)
                : `${formatCurrency(item.suggestedResaleRange.low)}-${formatCurrency(item.suggestedResaleRange.high)}`
            }
          />
          <InfoTile label="Condition" value={toTitleCase(item.condition)} />
          <InfoTile label="Why it matters" value={getBuyerStoryClosing(item)} />
          <InfoTile
            label="Where it is now"
            value={
              item.status === "sold"
                ? "Its reuse loop is complete."
                : ["approved", "ready-for-floor"].includes(item.status)
                  ? "It is ready for someone to choose it."
                  : "It is still moving through prep before it reaches the floor."
            }
          />
        </div>

        {item.status === "sold" ? (
          <StatePanel
            eyebrow="Loop completed"
            title="This piece already made it all the way home"
            body={story.preview}
            tone="slate"
          />
        ) : (
          <ActionPanel item={item} mode={mode} slot={slot} confirmed={confirmed} canBuy={canBuy} canSchedulePickup={canSchedulePickup} />
        )}

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">How this item got here</p>
          <div className="mt-4 space-y-3">
            {steps.map((step) => (
              <div
                key={step.label}
                className={`rounded-[1.25rem] border px-4 py-4 ${
                  step.complete
                    ? "border-sage-100 bg-white"
                    : step.active
                      ? "border-peach-100 bg-white"
                      : "border-transparent bg-white/70"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{step.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {canBuy && mode !== "buy" ? (
            <Link
              href={buildModeHref(item.id, "buy")}
              className="inline-flex items-center justify-center rounded-full bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-700"
            >
              Buy now
            </Link>
          ) : null}
          {canSchedulePickup && mode !== "pickup" ? (
            <Link
              href={buildModeHref(item.id, "pickup")}
              className="inline-flex items-center justify-center rounded-full border border-peach-200 bg-peach-50 px-5 py-3 text-sm font-semibold text-peach-600 transition hover:bg-peach-100"
            >
              Schedule pickup
            </Link>
          ) : null}
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActionPanel({
  item,
  mode,
  slot,
  confirmed,
  canBuy,
  canSchedulePickup
}: {
  item: DonationItem;
  mode?: "buy" | "pickup";
  slot?: PickupWindow;
  confirmed?: boolean;
  canBuy: boolean;
  canSchedulePickup: boolean;
}) {
  const story = getBuyerStory(item);
  const selectedWindow = slot ? pickupWindows[slot] : null;

  if (!mode) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Choose the next step</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {canBuy ? (
            <ModeCard
              eyebrow="Buy now"
              title="Claim it before someone else does"
              body={story.buyMessage}
              href={buildModeHref(item.id, "buy")}
              tone="sage"
            />
          ) : null}
          {canSchedulePickup ? (
            <ModeCard
              eyebrow="Schedule pickup"
              title={canBuy ? "Pick an easy handoff time" : "Save the pickup step for later"}
              body={story.pickupMessage}
              href={buildModeHref(item.id, "pickup")}
              tone="peach"
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (mode === "buy") {
    if (!canBuy) {
      return (
        <StatePanel
          eyebrow="Buy now"
          title="Buying opens once this piece is floor-ready"
          body="You can still follow the story now and come back as soon as staff marks it ready."
          tone="peach"
        />
      );
    }

    if (confirmed) {
      return (
        <StatePanel
          eyebrow="Buy now"
          title="Buy intent saved for the demo flow"
          body="This piece is now framed as the buyer’s next chapter, with pickup as the final handoff."
          tone="sage"
        />
      );
    }

    return (
      <div className="rounded-[1.5rem] border border-sage-100 bg-sage-50/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">Buy now</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Reserve this piece in one step</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{story.buyMessage}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <FlowPill label="Held for pickup" />
          <FlowPill label="Simple handoff" />
          <FlowPill label="Story included" />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href={buildModeHref(item.id, "buy", undefined, true)}
            className="inline-flex items-center justify-center rounded-full bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-700"
          >
            Confirm buy intent
          </Link>
          <Link
            href={buildModeHref(item.id)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to story
          </Link>
        </div>
      </div>
    );
  }

  if (!canSchedulePickup) {
    return (
      <StatePanel
        eyebrow="Pickup"
        title="Pickup is no longer available"
        body="This item already completed its journey, so the story is now here to show the full loop."
        tone="slate"
      />
    );
  }

  if (confirmed) {
    return (
      <StatePanel
        eyebrow="Pickup scheduled"
        title={selectedWindow ? `${selectedWindow.label} pickup is in the flow` : "Pickup request added"}
        body={selectedWindow ? selectedWindow.note : story.pickupMessage}
        tone="peach"
      />
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-peach-100 bg-peach-50/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-peach-600">Schedule pickup</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Choose a gentle pickup window</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{story.pickupMessage}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(pickupWindows) as PickupWindow[]).map((windowKey) => {
          const window = pickupWindows[windowKey];
          const isActive = slot === windowKey;

          return (
            <Link
              key={windowKey}
              href={buildModeHref(item.id, "pickup", windowKey)}
              className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-peach-300 bg-white text-peach-700"
                  : "border-peach-200 bg-peach-50 text-peach-600 hover:bg-peach-100"
              }`}
            >
              {window.label}
            </Link>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {selectedWindow ? selectedWindow.note : "Pick one of the simple windows above to continue."}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {selectedWindow ? (
          <Link
            href={buildModeHref(item.id, "pickup", slot, true)}
            className="inline-flex items-center justify-center rounded-full border border-peach-200 bg-white px-5 py-3 text-sm font-semibold text-peach-700 transition hover:bg-peach-100"
          >
            Confirm pickup
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-400">
            Choose a window first
          </span>
        )}
        <Link
          href={buildModeHref(item.id)}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to story
        </Link>
      </div>
    </div>
  );
}

function ModeCard({
  eyebrow,
  title,
  body,
  href,
  tone
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  tone: "sage" | "peach";
}) {
  const toneClasses =
    tone === "sage"
      ? "border-sage-100 bg-sage-50/70 text-sage-700 hover:bg-sage-100"
      : "border-peach-100 bg-peach-50/70 text-peach-600 hover:bg-peach-100";

  return (
    <Link href={href} className={`rounded-[1.25rem] border p-4 transition ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{eyebrow}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </Link>
  );
}

function StatePanel({
  eyebrow,
  title,
  body,
  tone
}: {
  eyebrow: string;
  title: string;
  body: string;
  tone: "sage" | "peach" | "slate";
}) {
  const toneClasses =
    tone === "sage"
      ? "border-sage-100 bg-sage-50/70"
      : tone === "peach"
        ? "border-peach-100 bg-peach-50/70"
        : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function FlowPill({ label }: { label: string }) {
  return <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{label}</span>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}
