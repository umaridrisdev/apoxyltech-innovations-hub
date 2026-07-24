"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import type { Paginated, Project } from "@/lib/types";

export default function PortalDashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api.get<Paginated<Project>>("/projects").then((res) => setProjects(res.data));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Your projects</h1>

      {projects === null && <p className="mt-6 text-slate-500">Loading...</p>}
      {projects?.length === 0 && (
        <p className="mt-6 text-slate-500">No projects yet — check back once one is created.</p>
      )}

      <ul className="mt-6 divide-y divide-slate-200 rounded border border-slate-200">
        {projects?.map((project) => (
          <li key={project.id}>
            <Link
              href={`/portal/projects/${project.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted"
            >
              <span className="font-medium">{project.name}</span>
              <StatusBadge value={project.status} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}