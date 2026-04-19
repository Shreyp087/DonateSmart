import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffLogoutButton } from "@/components/auth/staff-logout-button";
import { ItemGrid } from "@/components/dashboard/item-grid";
import { QrLookupForm } from "@/components/dashboard/qr-lookup-form";
import { SearchBar } from "@/components/dashboard/search-bar";
import { WeeklyNeedsEditor } from "@/components/dashboard/weekly-needs-editor";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getAllItems, getItemByQrCodeId, getWeeklyNeeds } from "@/lib/storage";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { query?: string; qr?: string };
}) {
  if (!(await isStaffAuthenticated())) {
    redirect("/staff-login");
  }

  const query = searchParams?.query?.trim().toLowerCase() || "";
  const qrLookup = searchParams?.qr?.trim() || "";

  if (qrLookup) {
    const extractedQrCodeId = extractQrCodeId(qrLookup);
    const extractedItemId = extractItemId(qrLookup);

    if (extractedItemId) {
      redirect(`/items/${extractedItemId}`);
    }

    if (extractedQrCodeId) {
      const matchedItem = await getItemByQrCodeId(extractedQrCodeId);
      if (matchedItem) {
        redirect(`/items/${matchedItem.id}`);
      }
    }
  }

  const items = await getAllItems();
  const weeklyNeeds = await getWeeklyNeeds();
  const filteredItems = query
    ? items.filter((item) => {
        const haystack = [item.id, item.qrCodeId, item.itemName, item.category, item.brand, item.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : items;

  const reviewCount = items.filter((item) => ["submitted", "waiting-approval", "received"].includes(item.status)).length;
  const floorCount = items.filter((item) => ["approved", "ready-for-floor"].includes(item.status)).length;
  const soldCount = items.filter((item) => item.status === "sold").length;
  const anonymousCount = items.filter((item) => item.isAnonymousDonation).length;

  return (
    <PageShell className="space-y-8">
      <section className="rounded-[2.75rem] border border-black/5 bg-white/78 px-6 py-8 shadow-card backdrop-blur sm:px-8 sm:py-10 lg:px-12">
        <SectionHeading
          eyebrow="Staff Desk"
          title="A calmer workspace for approvals, QR lookup, and item flow."
          description="Staff can scan a QR, pull up the record instantly, and keep the dock moving without digging through disconnected screens."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/donate"
                className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open donor intake
              </Link>
              <StaffLogoutButton />
            </div>
          }
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Waiting review" value={reviewCount} detail="Items still in the handoff or approval queue." />
          <MetricCard label="Ready for floor" value={floorCount} detail="Approved pieces that can move toward shoppers." />
          <MetricCard label="Sold" value={soldCount} detail="Items that already completed the reuse loop." />
          <MetricCard label="Anonymous" value={anonymousCount} detail="Donations submitted without a donor profile." />
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <WeeklyNeedsEditor weeklyNeeds={weeklyNeeds} />
          <QuickCard
            eyebrow="Dock Checklist"
            title="Keep the first minute simple"
            detail="For fast handoff, staff only need the donor choice, one clear photo, and a QR-ready record that can move with the item."
            href="/donate"
            cta="Open intake flow"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <QrLookupForm defaultValue={searchParams?.qr} />
        <div className="rounded-[2rem] border border-black/5 bg-white/84 p-6 shadow-card backdrop-blur">
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-500">Search Queue</p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-slate-950">Find the next item fast</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Search by item name, category, item ID, or QR code ID when the record is already in the system.
          </p>
          <div className="mt-5">
            <SearchBar defaultValue={searchParams?.query} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-500">Live Queue</p>
            <h2 className="mt-2 text-3xl font-medium tracking-tight text-slate-950">Everything currently moving through intake</h2>
          </div>
        </div>
        <ItemGrid items={filteredItems} />
      </div>
    </PageShell>
  );
}

function extractQrCodeId(value: string) {
  const match = value.match(/\b(\d{6})\b/);
  return match?.[1] ?? "";
}

function extractItemId(value: string) {
  const match = value.match(/\/items\/([^/?#]+)/i);
  return match?.[1] ?? "";
}

function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-black/5 bg-slate-50/80 px-5 py-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-medium tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function QuickCard({
  eyebrow,
  title,
  detail,
  href,
  cta
}: {
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[1.9rem] border border-black/5 bg-white px-5 py-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-400">{eyebrow}</p>
      <p className="mt-3 text-xl font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
      <Link href={href} className="mt-5 inline-flex text-sm font-medium text-sage-700 transition hover:text-sage-900">
        {cta}
      </Link>
    </div>
  );
}
