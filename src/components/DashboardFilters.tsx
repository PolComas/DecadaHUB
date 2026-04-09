import { useMemo } from "react";
import { riskTone } from "../lib/formatters";
import type { ClientOverview } from "../types";

type RiskLevel = "critical" | "warning" | "healthy";

export interface DashboardFilterState {
  riskLevels: RiskLevel[];
  owner: string;
}

export const EMPTY_FILTERS: DashboardFilterState = {
  riskLevels: [],
  owner: "",
};

interface DashboardFiltersProps {
  clients: ClientOverview[];
  filters: DashboardFilterState;
  onChange: (filters: DashboardFilterState) => void;
}

const RISK_CHIPS: { key: RiskLevel; label: string }[] = [
  { key: "critical", label: "Alto" },
  { key: "warning", label: "Medio" },
  { key: "healthy", label: "OK" },
];

export function filterClients(clients: ClientOverview[], filters: DashboardFilterState): ClientOverview[] {
  return clients.filter((c) => {
    if (filters.riskLevels.length > 0) {
      const tone = riskTone(c.risk_score_heuristic);
      if (!filters.riskLevels.includes(tone as RiskLevel)) return false;
    }
    if (filters.owner && c.owner_name !== filters.owner) return false;
    return true;
  });
}

export default function DashboardFilters({ clients, filters, onChange }: DashboardFiltersProps) {
  const owners = useMemo(() => {
    const set = new Set<string>();
    for (const c of clients) {
      if (c.owner_name) set.add(c.owner_name);
    }
    return Array.from(set).sort();
  }, [clients]);

  function toggleRisk(level: RiskLevel) {
    const next = filters.riskLevels.includes(level)
      ? filters.riskLevels.filter((r) => r !== level)
      : [...filters.riskLevels, level];
    onChange({ ...filters, riskLevels: next });
  }

  const isActive = filters.riskLevels.length > 0 || filters.owner !== "";

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Riesgo</span>
        {RISK_CHIPS.map((chip) => (
          <button
            key={chip.key}
            className={`filter-chip ${filters.riskLevels.includes(chip.key) ? "active" : ""}`}
            onClick={() => toggleRisk(chip.key)}
            type="button"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {owners.length > 1 ? (
        <div className="filter-group">
          <span className="filter-label">Responsable</span>
          <select
            className="filter-select"
            value={filters.owner}
            onChange={(e) => onChange({ ...filters, owner: e.target.value })}
          >
            <option value="">Todos</option>
            {owners.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      ) : null}

      {isActive ? (
        <button className="ghost-button filter-clear" onClick={() => onChange(EMPTY_FILTERS)} type="button">
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
