import { notFound } from "next/navigation";
import { DonorItemsOverview } from "@/components/donor/donor-items-overview";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDonorById, getItemsByDonorId } from "@/lib/storage";

export default async function DonorJourneyPage({ params }: { params: { id: string } }) {
  const donor = await getDonorById(params.id);

  if (!donor) {
    notFound();
  }

  const items = await getItemsByDonorId(donor.id);

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Your Items"
        title={`${donor.name}, here’s the full donation loop`}
        description="This page closes the emotional story: what arrived, what reached the floor, and what has already found a new home."
      />

      <DonorItemsOverview donor={donor} items={items} />
    </PageShell>
  );
}
