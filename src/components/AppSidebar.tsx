import { NavLink } from "react-router-dom";
import type { ClientOverview, DashboardOverview } from "../types";
import { initials, RiskPill, avatarTone } from "./ui";

interface AppSidebarProps {
  clients: ClientOverview[];
  dashboard: DashboardOverview | null;
  isBooting: boolean;
  isOpen: boolean;
  search: string;
  selectedClientId: string | null;
  onClose: () => void;
  onSearchChange: (value: string) => void;
}

export default function AppSidebar({
  clients,
  dashboard,
  isBooting,
  isOpen,
  search,
  selectedClientId,
  onClose,
  onSearchChange,
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
              <p style={{ fontSize: 11, color: "var(--sidebar-text)", marginTop: 1 }}>Client Hub</p>
            </div>
          </NavLink>
        </div>

        {dashboard && dashboard.mailboxes.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-head">
              <span>Comptes</span>
              <span>{dashboard.mailboxes.length}</span>
            </div>

            <div className="sidebar-stack">
              {dashboard.mailboxes.map((mailbox) => (
                <div className="sidebar-item" key={mailbox.id}>
                  <div className="sidebar-item-main">
                    <div className={`item-avatar ${avatarTone(mailbox.email)}`}>
                      {initials(mailbox.label)}
                    </div>
                    <div className="sidebar-item-copy">
                      <strong>{mailbox.label}</strong>
                      <p>{mailbox.email}</p>
                    </div>
                  </div>
                  <span className="assigned-badge">
                    {mailbox.owner_name ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-section">
          <label className="search-label" htmlFor="client-search">
            Cercar client
          </label>
          <input
            id="client-search"
            placeholder="Nom, owner o context..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="sidebar-section client-section">
          <div className="sidebar-section-head">
            <span>Clients</span>
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
              Cap client trobat.
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
                    <p>{client.owner_name ?? "Sense owner"}</p>
                  </div>
                </div>
                <div className="client-row-metrics">
                  <span>{client.overdue_actions} vençudes</span>
                  <span>{client.stalled_threads_gt_72h} parats</span>
                </div>
              </NavLink>
            ))}
        </div>

        <div className="sidebar-footer">
          <NavLink className="sidebar-footer-link" onClick={onClose} to="/dismissed">
            Clients descartats
          </NavLink>
        </div>
      </aside>
    </>
  );
}
