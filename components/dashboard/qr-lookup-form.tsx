import Link from "next/link";
import { QrScannerPanel } from "@/components/dashboard/qr-scanner-panel";

export function QrLookupForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white/84 p-6 shadow-card backdrop-blur">
      <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-500">QR Lookup</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Open the record directly from the QR</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        If the scanner opens the QR link, the product record will load automatically. If your scanner gives you the QR
        code value instead, paste the 6-digit QR code ID or the full scanned URL here.
      </p>

      <div className="mt-5">
        <QrScannerPanel />
      </div>

      <form action="/dashboard" className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="qr"
          defaultValue={defaultValue}
          placeholder="Paste QR code ID or scanned URL"
          className="w-full rounded-[1.25rem] border border-black/8 bg-white px-5 py-3 text-sm text-slate-900 outline-none transition focus:border-sage-300 focus:ring-4 focus:ring-sage-100"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-[1.25rem] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open item
          </button>
          <Link
            href="/dashboard"
            className="rounded-[1.25rem] border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </Link>
        </div>
      </form>
    </div>
  );
}
