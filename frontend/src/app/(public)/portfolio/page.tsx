const PLACEHOLDER_PROJECTS = [
  {
    name: "Example Project One",
    summary: "A short description of the problem this project solved and the outcome delivered.",
  },
  {
    name: "Example Project Two",
    summary: "A short description of the problem this project solved and the outcome delivered.",
  },
  {
    name: "Example Project Three",
    summary: "A short description of the problem this project solved and the outcome delivered.",
  },
];

export default function PortfolioPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Portfolio</h1>
      <p className="mt-4 text-lg text-slate-600">
        A selection of work across cybersecurity, AI, education, and business
        technology.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {PLACEHOLDER_PROJECTS.map((project) => (
          <div key={project.name} className="rounded border border-slate-200 p-6">
            <h2 className="text-lg font-medium">{project.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{project.summary}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate-500">
        [Placeholder content — replace these three cards with real case
        studies once you have client work you can showcase publicly. This
        page pulls static content for now; it's not backed by the CMS, which
        in Phase 1 only covers the blog.]
      </p>
    </main>
  );
}