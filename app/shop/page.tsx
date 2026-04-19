import Link from "next/link";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { getShopItems } from "@/lib/storage";

export default async function ShopPage() {
  const items = await getShopItems();

  const availableItems = items.filter((item) => ["approved", "ready-for-floor"].includes(item.status));
  const comingSoonItems = items.filter((item) => ["submitted", "waiting-approval", "received"].includes(item.status));
  const soldItems = items.filter((item) => item.status === "sold");

  return (
    <PageShell className="space-y-10">
      <SectionHeading
        eyebrow="Buyer Interface"
        title="Give donated pieces their next home"
        description="This is the buyer-facing side of the loop: browse what is available, reserve pickup, and read the little story that brought each item here."
        action={
          <Link
            href="/donate"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Donate an item
          </Link>
        }
      />

      <ShopCatalog
        title="Available now"
        description="These pieces are ready for their next owner and already have a story worth showing in the demo."
        items={availableItems}
      />

      <ShopCatalog
        title="Almost ready"
        description="Even before an item is listed, the buyer side can show that it is moving through a visible preparation journey."
        items={comingSoonItems}
      />

      <ShopCatalog
        title="Already loved"
        description="Sold items are part of the proof too. They show judges the loop actually closes instead of ending at intake."
        items={soldItems}
      />
    </PageShell>
  );
}
