import Link from "next/link";
import type { BlogPost, Paginated } from "@/lib/types";

// Must not attempt to fetch the backend at build time — the backend isn't
// available during `next build` (it's a separate container/host). Render
// this on request instead.
export const dynamic = "force-dynamic";

// Server-side code (this file) runs inside the frontend container and must
// reach the backend via its Docker network hostname (e.g. http://backend:8000),
// not the browser-facing NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8000),
// which only works from the user's browser. API_BASE_URL_INTERNAL is set in
// docker-compose.yml for exactly this reason; falls back to the public URL
// when running outside Docker (e.g. `next dev` directly on your machine).
const API_URL = process.env.API_BASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

async function getPosts(): Promise<Paginated<BlogPost>> {
  try {
    const res = await fetch(`${API_URL}/blog`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Blog API returned ${res.status}`);
    return res.json();
  } catch {
    // Backend unreachable — render an empty state instead of failing the page.
    return { data: [], meta: { page: 1, page_size: 20, total: 0 } };
  }
}

export default async function BlogListPage() {
  const { data: posts } = await getPosts();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Blog</h1>
      <ul className="mt-8 space-y-6">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="text-lg font-medium text-brand-700 hover:underline">
              {post.title}
            </Link>
          </li>
        ))}
        {posts.length === 0 && <p className="text-slate-500">No posts published yet.</p>}
      </ul>
    </main>
  );
}
