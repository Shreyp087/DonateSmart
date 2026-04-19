import { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2.5">
        {eyebrow ? (
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.4em] text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-3xl font-medium tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
