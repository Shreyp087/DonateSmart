"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WeeklyNeeds } from "@/lib/types";

function parseCategories(rawValue: string) {
  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 6)
    )
  );
}

export function WeeklyNeedsEditor({ weeklyNeeds }: { weeklyNeeds: WeeklyNeeds }) {
  const router = useRouter();
  const [draft, setDraft] = useState(weeklyNeeds.categories.join(", "));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(() => parseCategories(draft), [draft]);
  const updatedLabel = new Date(weeklyNeeds.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const categories = parseCategories(draft);

    if (categories.length === 0) {
      setError("Add at least one category.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");

    const response = await fetch("/api/weekly-needs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ categories })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error || "Unable to update this week's needs.");
      return;
    }

    setSuccess("This week's needs are live on the donor homepage.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="rounded-[1.9rem] border border-black/5 bg-white px-5 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-400">Demand Signal</p>
          <h2 className="mt-3 text-xl font-medium text-slate-950">Edit this week's needs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Donors see this on the homepage before they begin. Keep it short and update it once a week.
          </p>
        </div>
        <span className="rounded-full border border-black/8 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          Current list from {updatedLabel}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">High-demand categories</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-28 w-full resize-none rounded-[1.25rem] border border-black/8 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sage-300 focus:ring-4 focus:ring-sage-100"
            placeholder="Winter coats, Men's shoes, Children's books"
          />
          <p className="mt-2 text-xs text-slate-500">Separate categories with commas. Up to 6 items.</p>
        </label>

        <div className="rounded-[1.5rem] border border-black/5 bg-slate-50/80 p-4">
          <p className="text-sm font-medium text-slate-900">Homepage preview</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {preview.map((category) => (
              <div
                key={category}
                className="rounded-full border border-peach-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {success ? <p className="text-sm text-sage-700">{success}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "Saving..." : "Update donor homepage"}
        </button>
      </form>
    </section>
  );
}
