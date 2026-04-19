import Link from "next/link";
import { ApproveItemButton } from "@/components/dashboard/approve-item-button";
import { MarkSoldButton } from "@/components/dashboard/mark-sold-button";
import { DonationItem } from "@/lib/types";
import { CategoryBadge } from "@/components/ui/category-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, getSafeAppraisalSummary, toTitleCase } from "@/lib/utils";

export function ItemGrid({ items }: { items: DonationItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/80 px-6 py-16 text-center shadow-card">
        <p className="text-lg font-semibold text-slate-800">No items match this search.</p>
        <p className="mt-2 text-sm text-slate-500">Try a different item name or category keyword.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-[2rem] border border-black/5 bg-white/86 shadow-card backdrop-blur"
        >
          <div className="grid md:grid-cols-[220px_1fr]">
            <img src={item.imageDataUrl} alt={item.itemName} className="h-full min-h-60 w-full object-cover" />
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge label={toTitleCase(item.category)} />
                <StatusBadge status={item.status} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{item.itemName}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {toTitleCase(item.condition)} condition
                  {item.brand ? ` · ${item.brand}` : ""}
                  {item.size ? ` · Size ${item.size}` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Suggested resale range"
                  value={`${formatCurrency(item.suggestedResaleRange.low)}-${formatCurrency(item.suggestedResaleRange.high)}`}
                />
                <Metric
                  label="Pricing source"
                  value={
                    item.appraisal.pricingMethod === "gemini-grounded"
                      ? "Gemini + Google Search"
                      : item.appraisal.pricingMethod === "gemini"
                        ? "Gemini"
                        : "Rules fallback"
                  }
                />
                <Metric label="Item ID" value={item.id} />
                <Metric label="QR code ID" value={item.qrCodeId} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="line-clamp-2 text-sm text-slate-600">
                  {getSafeAppraisalSummary(item.appraisal.summary)}
                </p>
              </div>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-slate-500">
                  {item.status === "sold" && item.soldAt
                    ? `Sold ${formatDate(item.soldAt)} for ${formatCurrency(item.soldPrice || 0)}`
                    : `Submitted ${formatDate(item.createdAt)}`}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {["submitted", "waiting-approval", "received"].includes(item.status) ? (
                    <ApproveItemButton itemId={item.id} />
                  ) : null}
                  {["approved", "ready-for-floor"].includes(item.status) ? (
                    <MarkSoldButton itemId={item.id} />
                  ) : null}
                  <Link
                    href={`/items/${item.id}`}
                    className="shrink-0 rounded-full border border-sage-200 px-4 py-2 text-sm font-semibold text-sage-800 transition hover:bg-sage-50"
                  >
                    Open record
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/5 bg-slate-50/80 p-4">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-800">{value}</p>
    </div>
  );
}
