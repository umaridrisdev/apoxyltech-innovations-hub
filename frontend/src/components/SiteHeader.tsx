"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isAppRoute = pathname.startsWith("/admin") || pathname.startsWith("/portal");

  return (
    <header className="bg-ink-900">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-medium text-paper">
          ApoxylTech
        </Link>
        <div className="flex items-center gap-7 text-sm text-ink-300">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-paper">
              {link.label}
            </Link>
          ))}
          {!isAppRoute && (
            <Link
              href="/login"
              className="rounded border border-ink-600 px-4 py-1.5 text-paper hover:border-signal hover:text-signal"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
