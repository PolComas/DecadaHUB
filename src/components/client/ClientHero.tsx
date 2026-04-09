import { Link } from "react-router-dom";
import { RiskPill } from "../ui";
import type { ClientOverview } from "../../types";

interface ClientHeroProps {
  client: ClientOverview | null;
  isDismissing: boolean;
  onDismiss: () => void;
  onOpenMergeDialog: () => void;
}

export default function ClientHero({
  client,
  isDismissing,
  onDismiss,
  onOpenMergeDialog,
}: ClientHeroProps) {
  return (
    <section className="detail-hero">
      <div className="detail-hero-copy">
        <div className="detail-breadcrumbs">
          <Link className="topbar-link" to="/">Panel</Link>
          <span>/</span>
          <span>{client?.client_name ?? "Cliente"}</span>
        </div>
        <div className="detail-title-row">
          <div>
            <h2 className="detail-title">{client?.client_name ?? "Cargando..."}</h2>
          </div>
          {client ? <RiskPill score={client.risk_score_heuristic} /> : null}
        </div>
        {client?.primary_domain ? <p className="hero-text">{client.primary_domain}</p> : null}
      </div>
      <div className="detail-side-meta">
        <div className="session-chip muted">{client ? `${client.meetings_30d} reuniones / 30d` : "—"}</div>
        {client ? (
          <div className="detail-actions">
            <button className="ghost-button" onClick={onOpenMergeDialog} type="button">Fusionar</button>
            <button className="ghost-button danger" disabled={isDismissing} onClick={onDismiss} type="button">
              {isDismissing ? "Descartando..." : "Descartar"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
