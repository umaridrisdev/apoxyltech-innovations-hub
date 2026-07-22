import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApoxylTech Innovations Hub",
  description: "Cybersecurity, AI, education, and business services.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
