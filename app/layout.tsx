import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { DonationVoiceProvider } from "@/components/voice/donation-voice-context";

const ElevenLabsAssistant = dynamic(
  () => import("@/components/voice/elevenlabs-assistant").then((module) => module.ElevenLabsAssistant),
  { ssr: false }
);

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans"
});

export const metadata: Metadata = {
  title: "DonateSmart",
  description: "A polished donation intake and QR tracking app for hackathon demos.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${publicSans.variable} bg-canvas text-ink antialiased`}>
        <DonationVoiceProvider>
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />
            <div className="pointer-events-none absolute inset-x-[4%] top-24 h-[260px] rounded-[3rem] border border-black/5 bg-workspace-grid bg-[length:84px_84px] opacity-[0.06] sm:top-28 sm:h-[340px] lg:h-[440px]" />
            <div className="relative mx-auto flex min-h-screen max-w-[1380px] flex-col px-4 pb-12 sm:px-6 lg:px-8">
              <SiteHeader />
              <main className="flex-1">{children}</main>
            </div>
            <ElevenLabsAssistant />
          </div>
        </DonationVoiceProvider>
      </body>
    </html>
  );
}
