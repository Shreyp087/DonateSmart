import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadQrButton } from "@/components/qr/download-qr-button";
import { PageShell } from "@/components/ui/page-shell";
import { getDonorById, getItemById } from "@/lib/storage";

export default async function SuccessPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { donor?: string; anonymous?: string };
}) {
  const item = await getItemById(params.id);

  if (!item) {
    notFound();
  }

  const donorId = searchParams?.donor || item.donorId || undefined;
  const donor = donorId ? await getDonorById(donorId) : null;
  const nextItemHref = donor ? `/donate?donor=${donor.id}` : searchParams?.anonymous === "1" || item.isAnonymousDonation ? "/donate?anonymous=1" : "/donate";
  const exitHref = donor ? `/?donor=${donor.id}` : "/";

  return (
    <PageShell className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <section className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-card backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage-700">Submission Complete</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
          {item.itemName} is now in DonateSmart.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          The item record has been created, and the QR code is ready for staff when the donated item is delivered.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Your donation impact
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{item.donorImpactMessage}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {item.isAnonymousDonation
                ? "Anonymous donation"
                : item.status === "waiting-approval"
                  ? "Loyalty points incoming"
                  : "Loyalty points earned"}
            </p>
            <p className="mt-3 text-base font-semibold text-slate-900">
              {item.isAnonymousDonation ? "No loyalty points for this donation" : `${item.loyaltyPointsAwarded} points`}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {item.isAnonymousDonation
                ? "Because this item was donated anonymously, no donor profile or loyalty points were attached."
                : item.status === "waiting-approval"
                ? "These points will be added after staff approves the delivered item."
                : donor
                  ? `${donor.name} now has ${donor.totalLoyaltyPoints} total points.`
                  : "Points were added to the donor profile."}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-sage-100 bg-sage-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">The loop you can now follow</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.25rem] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Arrives</p>
              <p className="mt-2 text-sm text-slate-500">Staff scans or checks in the item after the physical handoff.</p>
            </div>
            <div className="rounded-[1.25rem] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Hits the floor</p>
              <p className="mt-2 text-sm text-slate-500">Once reviewed, it becomes part of the resale inventory.</p>
            </div>
            <div className="rounded-[1.25rem] bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Finds a new home</p>
              <p className="mt-2 text-sm text-slate-500">You can now show that full story instead of ending at submission.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {donor ? (
            <Link
              href={`/donor/${donor.id}`}
              className="rounded-full border border-peach-200 bg-peach-50 px-6 py-3 text-center text-sm font-semibold text-peach-600 transition hover:bg-peach-100"
            >
              Track my items
            </Link>
          ) : null}
          <Link
            href={nextItemHref}
            className="rounded-full bg-sage-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-sage-700"
          >
            Next item
          </Link>
          <Link
            href={exitHref}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Exit to home
          </Link>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-card backdrop-blur">
        <p className="text-sm font-semibold text-slate-900">QR code for staff</p>
        <p className="mt-2 text-sm text-slate-500">Attach or print this code so it can be scanned later.</p>
        <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4">
          <img src={item.qrCodeDataUrl} alt={`QR code for ${item.itemName}`} className="mx-auto h-64 w-64" />
        </div>
        <div className="mt-4">
          <DownloadQrButton qrCodeDataUrl={item.qrCodeDataUrl} itemId={item.id} />
        </div>
        <div className="mt-4 rounded-[1.25rem] bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">QR code ID</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{item.qrCodeId}</p>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Print or save this QR so staff can scan it quickly when the donation arrives.
        </p>
      </aside>
    </PageShell>
  );
}
