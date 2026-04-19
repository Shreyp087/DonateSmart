import { cn } from "@/lib/utils";

export function DetailImagePanel({
  src,
  alt,
  className
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/88 p-4 shadow-card backdrop-blur sm:p-6">
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-50 via-white to-sage-50/40 p-4 sm:p-6",
          className
        )}
      >
        <img src={src} alt={alt} className="block h-auto max-h-[68vh] w-auto max-w-full object-contain" />
      </div>
    </div>
  );
}
