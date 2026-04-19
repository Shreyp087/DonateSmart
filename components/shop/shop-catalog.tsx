import Link from "next/link";
import { DonationItem } from "@/lib/types";
import { getBuyerStory, getShopAvailabilityLabel, getShopAvailabilityTone, getStatusToneClass } from "@/lib/item-journey";
import { formatCurrency, toTitleCase } from "@/lib/utils";

export function ShopCatalog({
  title,
  description,
  items
}: {
  title: string;
  description: string;
  items: DonationItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((item) => {
          const story = getBuyerStory(item);
          const availability = getShopAvailabilityLabel(item);
          const tone = getShopAvailabilityTone(item);
          const canBuy = ["approved", "ready-for-floor"].includes(item.status);
          const canSchedulePickup = item.status !== "sold";

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/88 shadow-card backdrop-blur"
            >
              <div className="grid md:grid-cols-[220px_1fr]">
                <img src={item.imageDataUrl} alt={item.itemName} className="h-full min-h-64 w-full object-cover" />
                <div className="space-y-4 p-6">
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
                    <h3 className="text-2xl font-semibold text-slate-900">{item.itemName}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{story.preview}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Metric
                      label={item.status === "sold" ? "Final sale" : "Resale range"}
                      value={
                        item.status === "sold" && item.soldPrice
                          ? formatCurrency(item.soldPrice)
                          : `${formatCurrency(item.suggestedResaleRange.low)}-${formatCurrency(item.suggestedResaleRange.high)}`
                      }
                    />
                    <Metric label="Condition" value={toTitleCase(item.condition)} />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/shop/${item.id}`}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {item.status === "sold" ? "See the journey" : "Read its story"}
                    </Link>
                    {canBuy ? (
                      <Link
                        href={`/shop/${item.id}?mode=buy`}
                        className="inline-flex items-center justify-center rounded-full bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-700"
                      >
                        Buy now
                      </Link>
                    ) : null}
                    {!canBuy && canSchedulePickup ? (
                      <Link
                        href={`/shop/${item.id}?mode=pickup`}
                        className="inline-flex items-center justify-center rounded-full border border-peach-200 bg-peach-50 px-5 py-3 text-sm font-semibold text-peach-600 transition hover:bg-peach-100"
                      >
                        Schedule pickup
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
