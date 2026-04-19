import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffLogoutButton } from "@/components/auth/staff-logout-button";
import { ItemGrid } from "@/components/dashboard/item-grid";
import { SearchBar } from "@/components/dashboard/search-bar";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getInventoryItems } from "@/lib/storage";

export default async function InventoryPage({
  searchParams
}: {
  searchParams?: { query?: string; view?: string };
}) {
  if (!(await isStaffAuthenticated())) {
    redirect("/staff-login");
  }

  const query = searchParams?.query?.trim().toLowerCase() || "";
  const view = searchParams?.view === "sold" ? "sold" : "unsold";
  const items = await getInventoryItems();

  const inventoryItems = items.filter((item) => (view === "sold" ? item.status === "sold" : item.status !== "sold"));
  const filteredItems = query
    ? inventoryItems.filter((item) => {
        const haystack = [item.id, item.qrCodeId, item.itemName, item.category, item.brand, item.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : inventoryItems;

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Inventory"
        title={view === "sold" ? "Sold inventory history" : "Unsold inventory"}
        description={
          view === "sold"
            ? "Review items already sold, including the final sold price."
            : "Track items that are approved and still in inventory, or waiting to be sold."
        }
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
            <StaffLogoutButton />
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/inventory?view=unsold"
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              view === "unsold" ? "bg-sage-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Unsold items
          </Link>
          <Link
            href="/inventory?view=sold"
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              view === "sold" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Sold items
          </Link>
        </div>
      </div>

      <SearchBar defaultValue={searchParams?.query} actionPath="/inventory" extraParams={{ view }} />
      <ItemGrid items={filteredItems} />
    </PageShell>
  );
}
