import { cn } from "@/lib/utils";
import { ItemStatus } from "@/lib/types";
import { getStatusMeta, getStatusToneClass } from "@/lib/item-journey";

export function StatusBadge({ status }: { status: ItemStatus }) {
  const meta = getStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        getStatusToneClass(meta.tone)
      )}
    >
      {meta.badgeLabel}
    </span>
  );
}
