import Link from "next/link";
import { DonationItem, DonorProfile } from "@/lib/types";
import { getDonorLoopSummary } from "@/lib/item-journey";
export function LoyaltySummary({
  donor,
  items = []
}: {
  donor: DonorProfile;
  items?: DonationItem[];
}) {
  const recentItems = items.slice(0, 3);
  const soldCount = items.filter((item) => item.status === "sold").length;
  const floorCount = items.filter((item) => item.status === "ready-for-floor").length;

  return (
    <section className="rounded-[2.5rem] border border-black/5 bg-white/82 p-8 shadow-card backdrop-blur sm:p-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.38em] text-slate-500">Donor View</p>
      <h2 className="mt-3 text-4xl font-medium tracking-tight text-slate-950">
        {donor.name}, your items now have a visible story.
      </h2>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        You currently have <span className="font-medium text-slate-900">{donor.totalLoyaltyPoints} loyalty points</span>.
        Points are added after staff approves each delivered donation, and every item now stays visible from handoff to resale.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.6rem] border border-black/5 bg-slate-50/80 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">Total points</p>
          <p className="mt-3 text-3xl font-medium text-slate-900">{donor.totalLoyaltyPoints}</p>
        </div>
        <div className="rounded-[1.6rem] border border-black/5 bg-slate-50/80 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">On the floor</p>
          <p className="mt-3 text-base font-medium text-slate-900">
            {floorCount} item{floorCount === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Ready for shoppers to discover
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-black/5 bg-slate-50/80 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">Sold</p>
          <p className="mt-3 text-base font-medium text-slate-900">{soldCount} item{soldCount === 1 ? "" : "s"}</p>
          <p className="mt-2 text-sm text-slate-500">Already completed the circle</p>
        </div>
      </div>

      {recentItems.length > 0 ? (
        <div className="mt-8 rounded-[1.8rem] border border-black/5 bg-white/88 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Your item journey</p>
              <p className="mt-1 text-sm text-slate-500">
                See the full loop in one place: what arrived, what reached the floor, and what already found a new home.
              </p>
            </div>
            <Link
              href={`/donor/${donor.id}`}
              className="text-sm font-medium text-sage-700 transition hover:text-sage-900"
            >
              Open full journey
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentItems.map((item) => {
              const summary = getDonorLoopSummary(item);

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[1.35rem] border border-black/5 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.itemName}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.donorImpactMessage}</p>
                  </div>
                  <div className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-sage-800 ring-1 ring-inset ring-sage-100">
                    {summary.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/donate?donor=${donor.id}`}
          className="rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Donate another item
        </Link>
        <Link
          href={`/donor/${donor.id}`}
          className="rounded-full border border-peach-200 bg-peach-50 px-6 py-3 text-center text-sm font-medium text-peach-600 transition hover:bg-peach-100"
        >
          Track your items
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Browse the shop
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View staff dashboard
        </Link>
      </div>
    </section>
  );
}
