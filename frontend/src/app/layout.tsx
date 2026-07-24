import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});
const sansFont = Inter({ subsets: ["latin"], variable: "--font-sans" });
const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

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
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="font-sans">
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
              <Link
                href="/login"
                className="rounded border border-ink-600 px-4 py-1.5 text-paper hover:border-signal hover:text-signal"
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