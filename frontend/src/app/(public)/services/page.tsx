import Link from "next/link";

const SERVICES = [
  {
    title: "Cybersecurity",
    description:
      "Security assessments, hardening, and ongoing monitoring for businesses that can't afford to treat security as an afterthought.",
  },
  {
    title: "AI & Automation",
    description:
      "Practical AI integrations — from internal tooling to customer-facing features — built on infrastructure you actually understand and control.",
  },
  {
    title: "Education & Training",
    description:
      "Technical training programs for teams adopting new tools, frameworks, or security practices.",
  },
  {
    title: "Business Technology",
    description:
      "Custom platforms, client portals, and internal systems designed around how your business actually operates.",
  },
];

export default function ServicesPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Services</h1>
      <p className="mt-4 text-lg text-slate-600">
        Four areas, one team — cybersecurity, AI, education, and business
        technology, delivered by people who build and maintain what they ship.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {SERVICES.map((service) => (
          <div key={service.title} className="rounded border border-slate-200 p-6">
            <h2 className="text-lg font-medium">{service.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{service.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/contact"
          className="rounded bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Discuss a project
        </Link>
      </div>

      <p className="mt-10 text-sm text-slate-500">
        [Placeholder content — replace with your actual service offerings,
        pricing model, and engagement process.]
      </p>
    </main>
  );
}