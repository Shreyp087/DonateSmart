import Image from "next/image";
import Link from "next/link";

const workflowLanes = [
  {
    eyebrow: "Donor Lane",
    title: "Drop, photo, done",
    description: "Named or anonymous intake, plus bulk bags when needed.",
    href: "/donate",
    cta: "Open intake",
    tone: "sage"
  },
  {
    eyebrow: "Staff Lane",
    title: "Scan and review faster",
    description: "QR lookup, approvals, and item visibility in one place.",
    href: "/staff-login",
    cta: "Open staff desk",
    tone: "ink"
  },
  {
    eyebrow: "Buyer Lane",
    title: "Keep the story visible",
    description: "Buyer pages stay lighter, but the reuse story still stays clear.",
    href: "/shop",
    cta: "Open buyer side",
    tone: "peach"
  }
] as const;

const quickNotes = [
  "Named or anonymous in one flow",
  "Photo and QR record together",
  "Built for fast handoff volume"
] as const;

export function Hero() {
  return (
    <section className="space-y-5 lg:space-y-8">
      <div className="rounded-[2rem] border border-black/5 bg-white/78 px-5 py-6 shadow-[0_22px_70px_-32px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:rounded-[2.75rem] sm:px-8 sm:py-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.42em] text-slate-500">
                Donation Operations Workspace
              </span>
              <span className="rounded-full border border-peach-200 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.26em] text-peach-500">
                Donor + Staff First
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-3xl font-medium leading-[1.02] text-slate-950 sm:text-5xl lg:text-[3.7rem]">
                Faster donation drop-offs for donors and staff.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-lg sm:leading-7">
                Keep intake simple: identify the donor if needed, add the item, capture one clear photo, and hand
                staff a QR-ready record right away.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/donate"
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 sm:w-auto sm:px-7 sm:py-4"
              >
                Open donor intake
              </Link>
              <Link
                href="/staff-login"
                className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 sm:w-auto sm:px-7 sm:py-4"
              >
                Open staff desk
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-slate-600"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,242,0.94))] p-3 shadow-sm sm:rounded-[2.2rem] sm:p-4">
            <div className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-sage-50 sm:rounded-[1.9rem]">
              <Image
                src="/donate-sign.png"
                alt="DonateSmart donation drop-off"
                width={1400}
                height={1100}
                priority
                className="h-[220px] w-full object-cover sm:h-[360px] lg:h-[460px]"
              />
              <div className="border-t border-black/5 bg-white/88 p-4 backdrop-blur sm:p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-500">Simple handoff</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">1. Intake</p>
                    <p className="mt-1 text-sm text-slate-600">Named or anonymous.</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">2. Photo</p>
                    <p className="mt-1 text-sm text-slate-600">One clear image for staff review.</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">3. QR</p>
                    <p className="mt-1 text-sm text-slate-600">Ready for the next step.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {workflowLanes.map((lane) => (
          <article
            key={lane.eyebrow}
            className={`rounded-[1.8rem] border px-5 py-5 shadow-card backdrop-blur sm:rounded-[2rem] sm:px-6 sm:py-6 ${
              lane.tone === "sage"
                ? "border-sage-100 bg-white/84"
                : lane.tone === "ink"
                  ? "border-slate-200 bg-slate-950 text-white"
                  : "border-peach-100 bg-white/84"
            }`}
          >
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.34em] ${
                lane.tone === "ink" ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {lane.eyebrow}
            </p>
            <h2
              className={`mt-3 text-[1.65rem] font-medium tracking-tight sm:text-[1.95rem] ${
                lane.tone === "ink" ? "text-white" : "text-slate-950"
              }`}
            >
              {lane.title}
            </h2>
            <p className={`mt-3 text-sm leading-6 sm:text-base sm:leading-7 ${lane.tone === "ink" ? "text-slate-300" : "text-slate-600"}`}>
              {lane.description}
            </p>
            <Link
              href={lane.href}
              className={`mt-5 inline-flex items-center rounded-full px-5 py-3 text-sm font-medium transition ${
                lane.tone === "ink"
                  ? "bg-white text-slate-950 hover:bg-slate-100"
                  : lane.tone === "sage"
                    ? "bg-sage-700 text-white hover:bg-sage-800"
                    : "border border-peach-200 bg-peach-50 text-peach-600 hover:bg-peach-100"
              }`}
            >
              {lane.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
