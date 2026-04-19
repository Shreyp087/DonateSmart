import Link from "next/link";

const navItems = [
  { href: "/donate", label: "Donor Intake" },
  { href: "/staff-login", label: "Staff Desk" },
  { href: "/shop", label: "Buyer Shop" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 pt-4 sm:pt-5">
      <div className="rounded-[2rem] border border-black/5 bg-white/78 px-4 py-4 shadow-[0_14px_40px_-26px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:rounded-full sm:px-6 sm:py-3">
        <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-[2px] w-8 rounded-full bg-slate-900" />
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-700 text-sm font-medium text-white">
                DS
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-slate-800">DonateSmart</p>
                <p className="text-xs text-slate-500 sm:text-sm">Donation intake with QR tracking</p>
              </div>
            </Link>
          </div>

          <nav className="grid grid-cols-3 gap-2 text-sm font-medium sm:flex sm:flex-wrap sm:items-center sm:justify-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-black/6 px-3 py-2 text-center text-slate-600 transition hover:bg-black/[0.04] hover:text-slate-900 sm:border-transparent sm:px-4"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-start gap-3 lg:flex lg:justify-end">
            <span className="rounded-full border border-peach-200 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-peach-500">
              Mission Flow
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-sm text-slate-500">
              S
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
