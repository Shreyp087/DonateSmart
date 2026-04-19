import Link from "next/link";
import { DonationItem, DonorProfile } from "@/lib/types";
import { getDonorJourneySteps, getDonorLoopSummary } from "@/lib/item-journey";
import { formatCurrency } from "@/lib/utils";

export function DonorItemsOverview({
  donor,
  items
}: {
  donor: DonorProfile;
  items: DonationItem[];
}) {
  const arrivedCount = items.filter((item) => ["received", "approved", "ready-for-floor", "sold"].includes(item.status)).length;
  const onFloorCount = items.filter((item) => item.status === "ready-for-floor").length;
  const soldCount = items.filter((item) => item.status === "sold").length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryTile label="Items donated" value={`${items.length}`} note="Everything tied to this donor profile" />
        <SummaryTile label="Arrived" value={`${arrivedCount}`} note="Received and visible in the store loop" />
        <SummaryTile label="On floor" value={`${onFloorCount}`} note="Ready for shoppers right now" />
        <SummaryTile label="Sold" value={`${soldCount}`} note="Already found a new home" />
      </div>

      <div className="space-y-5">
        {items.map((item) => {
          const summary = getDonorLoopSummary(item);
          const steps = getDonorJourneySteps(item);

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/88 shadow-card backdrop-blur"
            >
              <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
                <img src={item.imageDataUrl} alt={item.itemName} className="h-full min-h-64 w-full object-cover" />

                <div className="space-y-5 p-6 sm:p-7">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-700">Donation loop</p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{item.itemName}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{item.donorImpactMessage}</p>
                    </div>

                    <div className="rounded-full bg-sage-50 px-4 py-2 text-sm font-semibold text-sage-800 ring-1 ring-inset ring-sage-100">
                      {summary.label}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {steps.map((step) => (
                      <div
                        key={step.label}
                        className={`rounded-[1.25rem] border px-4 py-4 ${
                          step.complete
                            ? "border-sage-100 bg-sage-50"
                            : step.active
                              ? "border-peach-100 bg-peach-50"
                              : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{step.label}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{step.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <InfoTile label="Suggested resale range" value={`${formatCurrency(item.suggestedResaleRange.low)}-${formatCurrency(item.suggestedResaleRange.high)}`} />
                    <InfoTile label="Loyalty" value={item.isAnonymousDonation ? "Anonymous donation" : `${item.loyaltyPointsAwarded} points`} />
                    <InfoTile label="What it means now" value={summary.detail} />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/items/${item.id}`}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Open record
                    </Link>
                    <Link
                      href={`/shop/${item.id}`}
                      className="inline-flex items-center justify-center rounded-full border border-peach-200 bg-peach-50 px-5 py-3 text-sm font-semibold text-peach-600 transition hover:bg-peach-100"
                    >
                      See buyer-facing story
                    </Link>
                    <Link
                      href={`/donate?donor=${donor.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-700"
                    >
                      Donate another item
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/88 p-5 shadow-card backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}
