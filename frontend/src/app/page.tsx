import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="bg-ink-900">
        <div className="mx-auto max-w-5xl px-6 py-28">
          <p className="font-mono text-xs tracking-widest text-signal">
            STATUS: PHASE 1 — LIVE
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-5xl font-medium leading-[1.1] text-paper">
            Security and software for businesses that can't afford to guess.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-300">
            ApoxylTech builds and operates cybersecurity, AI, and business
            infrastructure — the kind you can hand off and trust, not the
            kind you have to babysit.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/contact"
              className="rounded bg-signal px-5 py-2.5 text-sm font-medium text-ink-900 hover:bg-signal-dim"
            >
              Get in touch
            </Link>
            <Link
              href="/blog"
              className="rounded border border-ink-600 px-5 py-2.5 text-sm font-medium text-paper hover:border-signal hover:text-signal"
            >
              Read the blog
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-4">
          {[
            { label: "Cybersecurity", detail: "Assessment, hardening, monitoring" },
            { label: "AI & Automation", detail: "Practical, owned infrastructure" },
            { label: "Education", detail: "Technical training programs" },
            { label: "Business Tech", detail: "Platforms built around you" },
          ].map((item) => (
            <div key={item.label} className="border-t border-ink-100 pt-4">
              <p className="font-mono text-xs text-ink-300">{item.label}</p>
              <p className="mt-2 text-sm text-ink-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}