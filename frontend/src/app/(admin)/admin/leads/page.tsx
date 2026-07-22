"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Lead, Paginated } from "@/lib/types";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    api.get<Paginated<Lead>>("/leads").then((res) => setLeads(res.data));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Leads</h1>
      <p className="mt-1 text-sm text-slate-500">
        Contact-form submissions. Retained per the NDPR retention policy — older
        entries are purged automatically and will not appear here.
      </p>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Message</th>
            <th className="py-2">Received</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads?.map((lead) => (
            <tr key={lead.id}>
              <td className="py-2">{lead.name}</td>
              <td className="py-2">{lead.email}</td>
              <td className="max-w-xs truncate py-2">{lead.message}</td>
              <td className="py-2 text-slate-500">
                {new Date(lead.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads?.length === 0 && <p className="mt-6 text-slate-500">No leads yet.</p>}
    </main>
  );
}
