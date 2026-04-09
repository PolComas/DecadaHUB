import type { EmailThread, ThreadStatus } from "../../types";

const STATUS_CONFIG: { key: ThreadStatus; label: string; color: string }[] = [
  { key: "open", label: "Abiertos", color: "var(--accent)" },
  { key: "waiting_client", label: "Esperando cliente", color: "var(--risk-medium)" },
  { key: "waiting_team", label: "Esperando equipo", color: "var(--risk-high)" },
  { key: "closed", label: "Cerrados", color: "var(--text-tertiary)" },
];

interface ThreadStatusBarProps {
  threads: EmailThread[];
}

export default function ThreadStatusBar({ threads }: ThreadStatusBarProps) {
  if (threads.length === 0) return null;

  const counts = STATUS_CONFIG.map(({ key }) => ({
    key,
    count: threads.filter((t) => t.status === key).length,
  }));

  const total = threads.length;

  return (
    <div className="thread-status-section">
      <div className="thread-status-bar">
        {counts.map(({ key, count }) => {
          if (count === 0) return null;
          const cfg = STATUS_CONFIG.find((s) => s.key === key)!;
          return (
            <div
              key={key}
              className="thread-status-segment"
              style={{ flexBasis: `${(count / total) * 100}%`, background: cfg.color }}
              title={`${cfg.label}: ${count}`}
            />
          );
        })}
      </div>
      <div className="thread-status-legend">
        {counts.map(({ key, count }) => {
          if (count === 0) return null;
          const cfg = STATUS_CONFIG.find((s) => s.key === key)!;
          return (
            <span className="thread-status-legend-item" key={key}>
              <span className="thread-status-dot" style={{ background: cfg.color }} />
              {cfg.label} ({count})
            </span>
          );
        })}
      </div>
    </div>
  );
}
