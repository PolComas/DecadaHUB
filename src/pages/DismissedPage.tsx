import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDismissedClients, restoreClient } from "../lib/api";
import { formatDateTime } from "../lib/formatters";
import { useAppLayoutContext } from "../components/AppLayout";
import { EmptyState, initials, avatarTone } from "../components/ui";
import type { DismissedClient } from "../types";

export default function DismissedPage() {
  const { refreshDashboard } = useAppLayoutContext();
  const [clients, setClients] = useState<DismissedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    try {
      const data = await fetchDismissedClients();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error carregant clients descartats.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRestore(client: DismissedClient) {
    if (!window.confirm(`Restaurar "${client.name}"? Tornarà a ser visible al dashboard.`)) return;

    setRestoringId(client.id);
    try {
      await restoreClient(client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error restaurant client.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="page-header-copy">
          <div className="detail-breadcrumbs" style={{ color: "var(--text-tertiary)" }}>
            <Link className="topbar-link" to="/">Dashboard</Link>
            <span>/</span>
            <span>Clients descartats</span>
          </div>
          <h2 className="page-title">Clients descartats</h2>
          <p className="page-subtitle">
            Clients marcats com a inactius. Pots restaurar-los perque tornin a aparèixer al dashboard i al menú lateral.
          </p>
        </div>
      </section>

      {error && (
        <section className="callout error">
          <strong>Error</strong>
          <p>{error}</p>
        </section>
      )}

      <section className="card">
        {isLoading ? (
          <div className="stack-list">
            <div className="skeleton-block" />
            <div className="skeleton-block" />
            <div className="skeleton-block" />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            title="Cap client descartat"
            message="No hi ha clients inactius. Quan descartis un client des de la seva fitxa, apareixerà aquí."
          />
        ) : (
          <div className="stack-list">
            {clients.map((client) => (
              <div className="dismissed-row" key={client.id} title={client.name}>
                <div className="dismissed-row-main">
                  <div className={`item-avatar ${avatarTone(client.name)}`}>
                    {initials(client.name)}
                  </div>
                  <div className="dismissed-row-copy">
                    <strong>{client.name}</strong>
                    <p>{client.primary_domain ?? "Sense domini"}</p>
                  </div>
                </div>
                <div className="dismissed-row-meta">
                  <span className="dismissed-date">
                    Descartat {formatDateTime(client.updated_at)}
                  </span>
                  <button
                    className="restore-button"
                    disabled={restoringId === client.id}
                    onClick={() => void handleRestore(client)}
                    type="button"
                  >
                    {restoringId === client.id ? "Restaurant..." : "Restaurar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
