import Link from "next/link";

export function SearchBar({
  defaultValue,
  actionPath = "/dashboard",
  extraParams
}: {
  defaultValue?: string;
  actionPath?: string;
  extraParams?: Record<string, string>;
}) {
  const resetHref =
    extraParams && Object.keys(extraParams).length > 0
      ? `${actionPath}?${new URLSearchParams(extraParams).toString()}`
      : actionPath;

  return (
    <form action={actionPath} className="flex flex-col gap-3 sm:flex-row">
      {extraParams
        ? Object.entries(extraParams).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}
      <input
        type="search"
        name="query"
        defaultValue={defaultValue}
        placeholder="Search by item name, category, item ID, or QR code ID"
        className="w-full rounded-[1.25rem] border border-black/8 bg-white px-5 py-3 text-sm text-slate-900 outline-none transition focus:border-sage-300 focus:ring-4 focus:ring-sage-100 sm:min-w-80"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-[1.25rem] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Search
        </button>
        <Link
          href={resetHref}
          className="rounded-[1.25rem] border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
