"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/donate",
    label: "Donor Intake",
    matches: ["/donate", "/success", "/donor"]
  },
  {
    href: "/staff-login",
    label: "Staff Desk",
    matches: ["/staff-login", "/dashboard", "/items"]
  },
  {
    href: "/shop",
    label: "Buyer Shop",
    matches: ["/shop"]
  }
];

function isNavItemActive(pathname: string, matches: string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 pt-4 sm:pt-5">
      <div className="rounded-[2rem] border border-black/5 bg-white/84 px-4 py-4 shadow-[0_14px_40px_-26px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:rounded-full sm:px-6 sm:py-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-[2px] w-8 rounded-full bg-slate-900" />
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-700 text-sm font-semibold text-white">
                DS
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium uppercase tracking-[0.34em] text-slate-800">
                  DonateSmart
                </p>
                <p className="truncate text-xs text-slate-500 sm:text-sm">Donation intake with QR tracking</p>
              </div>
            </Link>
          </div>

          <nav className="-mx-1 flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.matches);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-950 text-white shadow-sm"
                      : "border border-black/6 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
