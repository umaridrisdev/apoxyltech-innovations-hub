"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    return <main className="mx-auto max-w-3xl px-6 py-16 text-slate-500">Checking access...</main>;
  }

  if (status === "denied") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-red-600">
          You need to be logged in to view this page. Redirecting to login...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}