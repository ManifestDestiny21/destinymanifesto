"use client";

import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileNav } from "@/components/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
