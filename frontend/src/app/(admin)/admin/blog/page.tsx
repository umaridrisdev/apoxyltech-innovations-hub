"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import type { BlogPost, BlogPostStatus, Paginated } from "@/lib/types";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  function loadPosts() {
    api
      .get<Paginated<BlogPost>>("/blog")
      .then((res) => setPosts(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load posts."));
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api.post<BlogPost>("/blog", {
        title: form.get("title"),
        body: form.get("body"),
      });
      (e.target as HTMLFormElement).reset();
      loadPosts();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create post.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
  }

  async function saveEdit(postId: string) {
    try {
      await api.patch<BlogPost>(`/blog/${postId}`, { title: editTitle, body: editBody });
      setEditingId(null);
      loadPosts();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save post.");
    }
  }

  async function toggleStatus(post: BlogPost) {
    const next: BlogPostStatus = post.status === "published" ? "draft" : "published";
    try {
      await api.patch<BlogPost>(`/blog/${post.id}`, { status: next });
      loadPosts();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to update status.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Blog</h1>

      <section className="mt-6 rounded border border-slate-200 p-4">
        <h2 className="text-sm font-medium text-slate-700">New post</h2>
        <form onSubmit={handleCreate} className="mt-3 space-y-3">
          <input
            name="title"
            required
            placeholder="Title"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            required
            rows={5}
            placeholder="Write the post..."
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {creating ? "Saving..." : "Save as draft"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      <ul className="mt-8 space-y-4">
        {posts?.map((post) => (
          <li key={post.id} className="rounded border border-slate-200 p-4">
            {editingId === post.id ? (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={5}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(post.id)}
                    className="rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{post.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    <StatusBadge value={post.status} /> · /blog/{post.slug}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(post)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(post)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {posts?.length === 0 && <p className="mt-6 text-slate-500">No posts yet — create one above.</p>}
    </main>
  );
}