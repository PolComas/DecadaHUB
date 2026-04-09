import { useState } from "react";
import { formatDateTime } from "../../lib/formatters";
import type { MergedClient } from "../../types";

interface MergedClientsSectionProps {
  mergedClients: MergedClient[];
  onUnmerge: (sourceId: string, sourceName: string) => void;
}

export default function MergedClientsSection({ mergedClients, onUnmerge }: MergedClientsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (mergedClients.length === 0) return null;

  return (
    <section className="merged-section">
      <button className="merged-section-toggle" onClick={() => setExpanded((v) => !v)} type="button">
        <h4>{expanded ? "▾" : "▸"} Clientes fusionados ({mergedClients.length})</h4>
      </button>
      {expanded && mergedClients.map((mc) => (
        <div className="merged-item" key={mc.id}>
          <div className="merged-item-info">
            <strong>{mc.name}</strong>
            <span>{mc.primary_domain ?? "Sin dominio"}{mc.merged_at ? ` · Fusionado el ${formatDateTime(mc.merged_at)}` : ""}</span>
          </div>
          <button className="unmerge-btn" onClick={() => onUnmerge(mc.id, mc.name)} type="button">
            Separar
          </button>
        </div>
      ))}
    </section>
  );
}
