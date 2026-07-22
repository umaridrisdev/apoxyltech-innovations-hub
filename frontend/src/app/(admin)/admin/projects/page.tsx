"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import type { Client, Paginated, Project, ProjectStatus } from "@/lib/types";

const STATUS_OPTIONS: ProjectStatus[] = [
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadProjects() {
    api
      .get<Paginated<Project>>("/projects")
      .then((res) => setProjects(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load projects.")
      );
  }

  useEffect(() => {
    loadProjects();
    api
      .get<Paginated<Client>>("/clients")
      .then((res) => setClients(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load clients.")
      );
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api.post<Project>("/projects", {
        client_id: form.get("client_id"),
        name: form.get("name"),
      });
      (e.target as HTMLFormElement).reset();
      loadProjects();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create project.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(projectId: string, status: ProjectStatus) {
    await api.patch<Project>(`/projects/${projectId}`, { status });
    loadProjects();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/admin/clients" className="text-sm text-brand-600 hover:underline">
          View clients
        </Link>
      </div>

      <section className="mt-6 rounded border border-slate-200 p-4">
        <h2 className="text-sm font-medium text-slate-700">New project</h2>
        <form onSubmit={handleCreate} className="mt-3 flex flex-wrap gap-3">
          <select
            name="client_id"
            required
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            disabled={clients.length === 0}
          >
            <option value="">
              {clients.length === 0 ? "No clients yet" : "Select a client"}
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name} ({c.user?.email})
              </option>
            ))}
          </select>
          <input
            name="name"
            required
            placeholder="Project name"
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating || clients.length === 0}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Status</th>
            <th className="py-2">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects?.map((project) => (
            <tr key={project.id}>
              <td className="py-2 font-medium">{project.name}</td>
              <td className="py-2">
                <select
                  value={project.status}
                  onChange={(e) =>
                    handleStatusChange(project.id, e.target.value as ProjectStatus)
                  }
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2 text-slate-500">
                {new Date(project.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {projects?.length === 0 && (
        <p className="mt-6 text-slate-500">No projects yet — create one above.</p>
      )}
    </main>
  );
}