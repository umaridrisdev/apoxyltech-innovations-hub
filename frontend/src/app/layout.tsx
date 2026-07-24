import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApoxylTech Innovations Hub",
  description: "Cybersecurity, AI, education, and business services.",
};

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold text-slate-900">
              ApoxylTech
            </Link>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-slate-900">
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="rounded bg-brand-600 px-4 py-1.5 text-white hover:bg-brand-700"
              >
                Log in
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}