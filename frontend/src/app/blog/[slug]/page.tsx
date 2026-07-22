import { notFound } from "next/navigation";
import type { BlogPost } from "@/lib/types";

// Same reason as the blog list page: don't fetch the backend at build time,
// and use the internal Docker network URL for server-side fetches.
export const dynamic = "force-dynamic";

const API_URL = process.env.API_BASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/blog/${slug}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Blog API returned ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">{post.title}</h1>
      <article className="prose mt-8 max-w-none whitespace-pre-wrap text-slate-700">
        {post.body}
      </article>
    </main>
  );
}
