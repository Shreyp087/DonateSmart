import { notFound } from "next/navigation";
import { ShopItemStory } from "@/components/shop/shop-item-story";
import { PageShell } from "@/components/ui/page-shell";
import { getShopItemById } from "@/lib/storage";

export default async function ShopItemPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { mode?: string; slot?: string; confirmed?: string };
}) {
  const item = await getShopItemById(params.id);

  if (!item) {
    notFound();
  }

  const mode = searchParams?.mode === "buy" || searchParams?.mode === "pickup" ? searchParams.mode : undefined;
  const slot =
    searchParams?.slot === "today" || searchParams?.slot === "tomorrow" || searchParams?.slot === "weekend"
      ? searchParams.slot
      : undefined;
  const confirmed = searchParams?.confirmed === "1";

  return (
    <PageShell>
      <ShopItemStory item={item} mode={mode} slot={slot} confirmed={confirmed} />
    </PageShell>
  );
}
