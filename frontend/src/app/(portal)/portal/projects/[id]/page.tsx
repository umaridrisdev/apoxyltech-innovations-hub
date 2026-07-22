"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Paginated, ProjectDetail, ProjectFile } from "@/lib/types";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let ignore = false;

    api
      .get<ProjectDetail>(`/projects/${params.id}`)
      .then((res) => {
        if (!ignore) setProject(res);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load project.");
      });

    api
      .get<Paginated<ProjectFile>>(`/projects/${params.id}/files`)
      .then((res) => {
        if (!ignore) setFiles(res.data);
      })
      .catch((err) => {
        // Don't overwrite a project-load error with a files-load error —
        // whichever fails first stays visible, since either one blocks the
        // page from being fully usable.
        if (!ignore) setError((prev) => prev ?? (err instanceof Error ? err.message : "Failed to load files."));
      });

    return () => {
      ignore = true;
    };
  }, [params.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploaded = await api.post<ProjectFile>(`/projects/${params.id}/files`, formData);
      setFiles((prev) => [uploaded, ...prev]);
    } catch (err) {
      // Expected to fail until real Cloudflare R2 credentials are set in
      // backend/.env — see R2_ACCOUNT_ID etc. in .env.example.
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (error && !project) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }
  if (!project) return <main className="mx-auto max-w-3xl px-6 py-16">Loading...</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Status: {project.status}</p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Milestones</h2>
        <ul className="mt-3 space-y-2">
          {project.milestones.map((m) => (
            <li key={m.id} className="flex justify-between rounded border border-slate-200 px-3 py-2">
              <span>{m.title}</span>
              <span className="text-sm text-slate-500">{m.due_date ?? "No due date"}</span>
            </li>
          ))}
          {project.milestones.length === 0 && (
            <p className="text-sm text-slate-500">No milestones yet.</p>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Files</h2>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          className="mt-3 text-sm disabled:opacity-50"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f.id}>
              <a href={f.file_url} className="text-brand-600 hover:underline" target="_blank" rel="noreferrer">
                {f.file_url.split("/").pop()}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}