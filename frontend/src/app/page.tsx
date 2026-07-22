import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
        ApoxylTech Innovations Hub
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Cybersecurity, AI, education, and business services — Phase 1 launch.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/contact"
          className="rounded bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Get in touch
        </Link>
        <Link
          href="/blog"
          className="rounded border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-surface-muted"
        >
          Read the blog
        </Link>
      </div>
    </main>
  );
}
