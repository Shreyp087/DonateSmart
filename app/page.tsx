import { PageShell } from "@/components/ui/page-shell";
import { Hero } from "@/components/home/hero";
import { LoyaltySummary } from "@/components/home/loyalty-summary";
import { WeeklyNeedsBanner } from "@/components/home/weekly-needs-banner";
import { getDonorById, getItemsByDonorId, getWeeklyNeeds } from "@/lib/storage";

export default async function HomePage({
  searchParams
}: {
  searchParams?: { donor?: string };
}) {
  const donor = searchParams?.donor ? await getDonorById(searchParams.donor) : null;
  const donorItems = donor ? await getItemsByDonorId(donor.id) : [];
  const weeklyNeeds = await getWeeklyNeeds();

  return (
    <PageShell className="space-y-10">
      <WeeklyNeedsBanner weeklyNeeds={weeklyNeeds} />
      <Hero />
      {donor ? <LoyaltySummary donor={donor} items={donorItems} /> : null}
    </PageShell>
  );
}
