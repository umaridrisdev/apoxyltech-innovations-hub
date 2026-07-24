"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";

const ADMIN_LINKS = [
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/leads", label: "Leads" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // "checking" prevents a flash of the admin UI before we know whether the
  // visitor is actually authenticated — without this, anyone could
  // navigate straight to /admin/projects and see the full admin shell
  // (nav, forms, tables) even though the underlying data calls would
  // correctly 401/403. The UI itself shouldn't be visible either.
  const [status, setStatus] = useState<"checking" | "authenticated" | "denied">("checking");

  useEffect(() => {
    let ignore = false;
    api
      .get("/users/me")
      .then(() => {
        if (!ignore) setStatus("authenticated");
      })
      .catch((err) => {
        if (ignore) return;
        setStatus("denied");
        if (err instanceof ApiClientError && err.status === 401) {
          router.replace("/login");
        }
      });
    return () => {
      ignore = true;
    };
  }, [router]);

  if (status === "checking") {
    return <main className="mx-auto max-w-4xl px-6 py-16 text-slate-500">Checking access...</main>;
  }

  if (status === "denied") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm text-red-600">
          You need to be logged in to view this page. Redirecting to login...
        </p>
      </main>
    );
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-surface-muted">
        <nav className="mx-auto flex max-w-4xl gap-6 px-6 py-3 text-sm text-slate-600">
          {ADMIN_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}