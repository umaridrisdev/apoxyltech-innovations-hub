// The signature element: state rendered like real system output — a
// monospace label with a colored dot — rather than a decorative pill.
// Used anywhere something has a real state: project status, blog
// draft/published, account status.
type StatusTone = "active" | "pending" | "idle" | "alert";

const TONE_MAP: Record<string, StatusTone> = {
  // projects
  planning: "idle",
  in_progress: "active",
  on_hold: "pending",
  completed: "active",
  cancelled: "alert",
  // blog
  draft: "pending",
  published: "active",
  // users / clients
  active: "active",
  pending_verification: "pending",
  deactivated: "alert",
};

export function StatusBadge({ value }: { value: string }) {
  const tone = TONE_MAP[value] ?? "idle";
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-600">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "active"
            ? "bg-state-active"
            : tone === "pending"
              ? "bg-state-pending"
              : tone === "alert"
                ? "bg-state-alert"
                : "bg-state-idle"
        }`}
      />
      {value.replace(/_/g, " ")}
    </span>
  );
}