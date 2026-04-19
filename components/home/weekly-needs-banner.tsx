import Link from "next/link";
import { WeeklyNeeds } from "@/lib/types";

export function WeeklyNeedsBanner({ weeklyNeeds }: { weeklyNeeds: WeeklyNeeds }) {
  const updatedLabel = new Date(weeklyNeeds.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  return (
    <section className="rounded-[2rem] border border-peach-200 bg-peach-50/90 px-5 py-5 shadow-card backdrop-blur sm:rounded-[2.25rem] sm:px-8 sm:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-peach-600">What We Need This Week</p>
          <h2 className="mt-3 text-xl font-medium tracking-tight text-slate-950 sm:text-3xl">
            Help Goodwill receive what people are asking for right now.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Staff updates this list weekly so donors can bring the most useful items before they even start intake.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start lg:flex-col lg:items-end">
          <span className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-600">
            Updated {updatedLabel}
          </span>
          <Link
            href="/donate"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Start donation
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {weeklyNeeds.categories.map((category) => (
          <div
            key={category}
            className="rounded-full border border-peach-200 bg-white px-4 py-2 text-sm font-medium text-slate-800"
          >
            {category}
          </div>
        ))}
      </div>
    </section>
  );
}
