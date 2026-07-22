"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Client, Paginated } from "@/lib/types";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .get<Paginated<Client>>("/clients")
      .then((res) => {
        if (!ignore) setClients(res.data);
      })
      .catch((err) => {
        // Without this catch, React Strict Mode's dev-only double-invoke of
        // effects can turn a harmless superseded first call into an
        // unhandled promise rejection, which Next's dev overlay shows as a
        // blocking full-page error even when the page is actually fine.
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load clients.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href="/admin/projects"
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Go to Projects
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2">Company</th>
            <th className="py-2">Contact email</th>
            <th className="py-2">Account status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients?.map((client) => (
            <tr key={client.id}>
              <td className="py-2 font-medium">{client.company_name}</td>
              <td className="py-2">{client.user?.email ?? "—"}</td>
              <td className="py-2 text-slate-500">{client.user?.status ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {clients?.length === 0 && (
        <p className="mt-6 text-slate-500">
          No clients yet. A client account is created automatically when someone
          registers — there's no separate "add client" step in Phase 1.
        </p>
      )}
      {clients === null && <p className="mt-6 text-slate-500">Loading...</p>}
    </main>
  );
}