import { NavLink } from "react-router-dom";
import type { ClientOverview, DashboardOverview } from "../types";
import { initials, RiskPill, avatarTone } from "./ui";

interface AppSidebarProps {
  activeMailboxIds: string[];
  clients: ClientOverview[];
  dashboard: DashboardOverview | null;
  isBooting: boolean;
  isOpen: boolean;
  search: string;
  selectedClientId: string | null;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onToggleMailbox: (id: string) => void;
}

export default function AppSidebar({
  activeMailboxIds,
  clients,
  dashboard,
  isBooting,
  isOpen,
  search,
  selectedClientId,
  onClose,
  onSearchChange,
  onToggleMailbox,
}: AppSidebarProps) {
  return (
    <>
      <button
        aria-hidden={!isOpen}
        className={`sidebar-backdrop ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <NavLink className="brand-block brand-link" onClick={onClose} to="/">
            <div className="brand-mark">D</div>
            <div>
              <h1>DecadaHUB</h1>
              <p style={{ fontSize: 11, color: "var(--sidebar-text)", marginTop: 1 }}>Hub de clientes</p>
            </div>
          </NavLink>
        </div>

        {dashboard && dashboard.mailboxes.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-head">
              <span>Mailboxes</span>
              <span>{dashboard.mailboxes.length}</span>
            </div>

            <div className="sidebar-stack">
              {dashboard.mailboxes.map((mailbox) => {
                const isActive = activeMailboxIds.includes(mailbox.id);
                return (
                  <button
                    className={`sidebar-item ${isActive ? "" : "mailbox-inactive"}`}
                    key={mailbox.id}
                    onClick={() => onToggleMailbox(mailbox.id)}
                    title={isActive ? `Ocultar ${mailbox.label}` : `Mostrar ${mailbox.label}`}
                    type="button"
                  >
                    <div className="sidebar-item-main">
                      <div className={`item-avatar ${isActive ? avatarTone(mailbox.email) : "muted"}`}>
                        {initials(mailbox.label)}
                      </div>
                      <div className="sidebar-item-copy">
                        <strong>{mailbox.label}</strong>
                        <p>{mailbox.email}</p>
                      </div>
                    </div>
                    <span className={`mailbox-status-dot ${isActive ? "on" : "off"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="sidebar-section">
          <label className="search-label" htmlFor="client-search">
            Buscar cliente
          </label>
          <input
            id="client-search"
            placeholder="Nombre, responsable o contexto..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="sidebar-section client-section">
          <div className="sidebar-section-head">
            <span>Clientes</span>
            <span>{clients.length}</span>
          </div>

          {isBooting && (
            <>
              <div className="skeleton-block" style={{ height: 60 }} />
              <div className="skeleton-block" style={{ height: 60 }} />
              <div className="skeleton-block" style={{ height: 60 }} />
            </>
          )}

          {!isBooting && clients.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 4px" }}>
              No se ha encontrado ningún cliente.
            </p>
          )}

          {!isBooting &&
            clients.map((client) => (
              <NavLink
                className={`client-row ${selectedClientId === client.id ? "selected" : ""}`}
                key={client.id}
                onClick={onClose}
                title={client.client_name}
                to={`/clients/${client.id}`}
              >
                <div className="client-row-main">
                  <div className={`item-avatar ${avatarTone(client.client_name)}`}>
                    {initials(client.client_name)}
                  </div>
                  <div className="client-row-copy">
                    <div className="client-row-top">
                      <strong>{client.client_name}</strong>
                      <RiskPill score={client.risk_score_heuristic} />
                    </div>
                    <p>{client.owner_name ?? "Sin responsable"}</p>
                  </div>
                </div>
                <div className="client-row-metrics">
                  <span>{client.overdue_actions} vencidas</span>
                  <span>{client.stalled_threads_gt_72h} estancados</span>
                </div>
              </NavLink>
            ))}
        </div>

        <div className="sidebar-footer">
          <NavLink className="sidebar-footer-link" onClick={onClose} to="/orphan-transcripts">
            Transcripciones sin asignar
          </NavLink>
          <NavLink className="sidebar-footer-link" onClick={onClose} to="/dismissed">
            Clientes descartados
          </NavLink>
        </div>
      </aside>
    </>
  );
}
