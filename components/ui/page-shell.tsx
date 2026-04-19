import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("py-8 sm:py-10 lg:py-12", className)}>{children}</section>;
}
