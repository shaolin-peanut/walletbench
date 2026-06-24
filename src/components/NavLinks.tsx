"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/challenges", label: "Challenges" },
  { href: "/runs", label: "Runs" },
  { href: "/trace", label: "Trace" },
  { href: "/receipts", label: "Receipts" },
  { href: "/demo", label: "Demo" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks() {
  const pathname = usePathname() ?? "/";
  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "text-white font-semibold border-b-2 border-indigo-400 pb-0.5"
                : "text-gray-300 transition hover:text-white"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
