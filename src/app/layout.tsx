import type { Metadata } from "next";
import "./globals.css";
import WorkstationHeader from "@/components/WorkstationHeader";

export const metadata: Metadata = {
  title: "TerraClear AI — Satellite Image Restoration Workstation",
  description:
    "Multimodal Sentinel-1 SAR-guided optical satellite cloud removal and deep learning reconstruction workstation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-[#090B0E] text-[#F3F4F6] selection:bg-[#10B981]/25 selection:text-[#10B981]">
        <div className="flex min-h-screen flex-col bg-[#090B0E]">
          <WorkstationHeader />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
