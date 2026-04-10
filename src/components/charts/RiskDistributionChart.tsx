import { useMemo } from "react";
import { riskTone } from "../../lib/formatters";
import type { ClientOverview } from "../../types";

const SEGMENTS = [
  { key: "critical", label: "Alto", color: "var(--risk-high)" },
  { key: "warning", label: "Medio", color: "var(--risk-medium)" },
  { key: "healthy", label: "OK", color: "var(--risk-ok)" },
] as const;

const SIZE = 108;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RiskDistributionChartProps {
  clients: ClientOverview[];
}

export default function RiskDistributionChart({ clients }: RiskDistributionChartProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { critical: 0, warning: 0, healthy: 0 };
    for (const c of clients) {
      const tone = riskTone(c.risk_score_heuristic);
      map[tone] = (map[tone] ?? 0) + 1;
    }
    return SEGMENTS.map((s) => ({ ...s, count: map[s.key] }));
  }, [clients]);

  const total = clients.length;
  if (total === 0) return null;

  let offset = 0;
  const arcs = counts.map((seg) => {
    const pct = seg.count / total;
    const dash = pct * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const arc = { ...seg, dashArray: `${dash} ${gap}`, dashOffset: -offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="risk-chart">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="risk-chart-svg">
        {arcs.map((arc) =>
          arc.count > 0 ? (
            <circle
              key={arc.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ) : null,
        )}
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" className="risk-chart-total">{total}</text>
        <text x={SIZE / 2} y={SIZE / 2 + 12} textAnchor="middle" className="risk-chart-label">clientes</text>
      </svg>
      <div className="risk-chart-legend">
        {counts.map((seg) => (
          <span className="risk-chart-legend-item" key={seg.key}>
            <span className="risk-chart-dot" style={{ background: seg.color }} />
            {seg.label}: {seg.count}
          </span>
        ))}
      </div>
    </div>
  );
}
