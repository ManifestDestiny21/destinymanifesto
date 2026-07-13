"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_TABS } from "@/lib/navigation";

const ICONS: Record<string, string> = {
  home: "⌂",
  briefcase: "💼",
  sparkles: "✦",
  library: "☰",
  mail: "✉",
};

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#7a7974]/15 bg-[#fbfbf9]/95 backdrop-blur md:hidden"
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {MOBILE_TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium ${
                  active ? "text-[#01696f]" : "text-[#7a7974]"
                }`}
              >
                <span className="text-base leading-none">{ICONS[tab.icon]}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
