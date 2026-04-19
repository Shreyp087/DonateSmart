"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const ElevenLabsAssistantRuntime = dynamic(
  () => import("@/components/voice/elevenlabs-assistant-runtime").then((module) => module.ElevenLabsAssistantRuntime),
  { ssr: false, loading: () => null }
);

export function ElevenLabsAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const shouldShowLauncher = pathname === "/donate";
  const shouldLoadRuntime = useMemo(() => isOpen, [isOpen]);

  useEffect(() => {
    if (!shouldShowLauncher && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, shouldShowLauncher]);

  if (!shouldShowLauncher) {
    return null;
  }

  return (
    <>
      {shouldLoadRuntime ? (
        <ElevenLabsAssistantRuntime isOpen={isOpen} onToggle={() => setIsOpen((current) => !current)} />
      ) : null}

      {!isOpen ? (
        <div className="fixed bottom-4 right-4 z-30 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-5 sm:right-5 sm:max-w-sm">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-slate-700 sm:gap-3 sm:px-5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">AI</span>
            <span>Voice guide</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
