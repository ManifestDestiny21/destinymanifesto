"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SIDEBAR_SECTIONS } from "@/lib/navigation";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#7a7974]/15 bg-[#fbfbf9] md:flex">
      <div className="border-b border-[#7a7974]/10 p-5">
        <BrandLogo size="sm" />
        <p className="mt-2 text-xs text-[#7a7974]">Build your next chapter.</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[#7a7974]">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-[#01696f]/12 text-[#01696f]"
                          : "text-[#28251d] hover:bg-[#f7f6f2]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-[#7a7974]/10 p-4">
        <p className="rounded-xl bg-[#b8860b]/15 px-3 py-2 text-xs font-medium text-[#964219]">
          Launch offer: Free access for the first 3 months.
        </p>
      </div>
    </aside>
  );
}
