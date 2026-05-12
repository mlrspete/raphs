"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tests", label: "Landing Tests" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/funnels", label: "Funnels" },
  { href: "/admin/exports", label: "Exports" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="grid gap-1">
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-orange/25 ${
              active ? "bg-orange text-ink shadow-soft" : "text-ink/68 hover:bg-white hover:text-ink"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
