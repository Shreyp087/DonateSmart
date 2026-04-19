import { DonationForm } from "@/components/donate/donation-form";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDonorById } from "@/lib/storage";

export default async function DonatePage({
  searchParams
}: {
  searchParams?: { donor?: string; anonymous?: string };
}) {
  const donor = searchParams?.donor ? await getDonorById(searchParams.donor) : null;
  const startAnonymous = searchParams?.anonymous === "1";

  return (
    <PageShell className="space-y-6">
      <section className="rounded-[2.5rem] border border-black/5 bg-white/80 px-6 py-7 shadow-card backdrop-blur sm:px-8 sm:py-8 lg:px-10">
        <SectionHeading
          eyebrow="Donor Intake"
          title={donor ? `Add the next item for ${donor.name}.` : "Submit an item for donation."}
          description={
            donor
              ? "Your donor details are already loaded, so you can move straight into the next item."
              : startAnonymous
                ? "Anonymous mode is on. Add the item, take the photo, and create the QR-linked record."
                : "Keep it simple: donor details if needed, item details, one photo, then submit."
          }
        />

        <div className="mt-5 flex flex-wrap gap-3">
          <WorkflowPill label="Named or anonymous" />
          <WorkflowPill label="Bulk clothing supported" />
          <WorkflowPill label="Photo + QR in one flow" />
        </div>
      </section>

      <DonationForm donor={donor} startAnonymous={startAnonymous} />
    </PageShell>
  );
}

function WorkflowPill({ label }: { label: string }) {
  return <div className="rounded-full border border-black/8 bg-slate-50 px-4 py-2 text-sm text-slate-600">{label}</div>;
}
