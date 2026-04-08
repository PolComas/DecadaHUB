import { Link } from "react-router-dom";
import { formatCompactNumber, formatHours } from "../lib/formatters";
import { useAppLayoutContext } from "../components/AppLayout";
import {
  ActivityCallout,
  ClientListRow,
  EmptyState,
  MetricCard,
  RiskPill,
  SkeletonBlock,
} from "../components/ui";

export default function DashboardPage() {
  const { dashboard, isBooting, globalError } = useAppLayoutContext();
  const summary = dashboard?.summary;
  const topRiskClients = dashboard?.clients.slice(0, 3) ?? [];
  const slowestTeamReplies =
    dashboard?.clients
      .filter((client) => client.avg_team_response_hours_30d > 0)
      .sort((a, b) => b.avg_team_response_hours_30d - a.avg_team_response_hours_30d)
      .slice(0, 4) ?? [];

  return (
    <>
      <section className="dashboard-header">
        <div className="dashboard-header-copy">
          <h2>Pulso de cartera</h2>
          <p>
            Relación, respuesta y riesgo para priorizar mejor el día.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <MetricCard
          label="Clientes activos"
          note="Cartera visible"
          value={summary ? String(summary.totalClients) : "—"}
        />
        <MetricCard
          label="Correos 30d"
          note="Entrantes + salientes"
          value={summary ? formatCompactNumber(summary.totalEmails30d) : "—"}
        />
        <MetricCard
          label="Respuesta equipo"
          note="Media h. laborables"
          value={summary ? formatHours(summary.averageTeamResponseHours) : "—"}
        />
        <MetricCard
          label="Clientes críticos"
          note="Puntuación de riesgo >= 6"
          value={summary ? String(summary.highRiskClients) : "—"}
        />
        <MetricCard
          label="Reuniones 30d"
          note="Calendario consolidado"
          value={summary ? String(summary.totalMeetings30d) : "—"}
        />
        <MetricCard
          label="Acciones abiertas"
          note="Seguimiento pendiente"
          value={summary ? String(summary.openActions) : "—"}
        />
      </section>

      {globalError ? (
        <section className="callout error">
          <strong>No se ha podido cargar el panel.</strong>
          <p>{globalError}</p>
        </section>
      ) : null}

      <section className="two-up two-up-wide">
        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Prioridades</p>
              <h3>Clientes a vigilar hoy</h3>
            </div>
          </div>

          {isBooting ? (
            <div className="priority-grid">
              <SkeletonBlock />
              <SkeletonBlock />
              <SkeletonBlock />
            </div>
          ) : topRiskClients.length ? (
            <div className="priority-grid">
              {topRiskClients.map((client) => (
                <Link className="priority-card" key={client.id} to={`/clients/${client.id}`}>
                  <div className="priority-card-head">
                    <strong>{client.client_name}</strong>
                    <RiskPill score={client.risk_score_heuristic} />
                  </div>
                  <p>{client.notes ?? "Sin contexto adicional."}</p>
                  <div className="priority-metrics">
                    <span>{client.stalled_threads_gt_72h} hilos estancados</span>
                    <span>{client.overdue_actions} acciones vencidas</span>
                    <span>{client.negative_signals_30d} señales neg.</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              message="Cuando haya clientes cargados, aparecerán aquí."
              title="Sin clientes"
            />
          )}
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Seguimiento de respuestas</p>
              <h3>Tiempo de respuesta</h3>
            </div>
          </div>

          {isBooting ? (
            <div className="stack-list">
              <SkeletonBlock />
              <SkeletonBlock />
            </div>
          ) : slowestTeamReplies.length ? (
            <div className="stack-list">
              {slowestTeamReplies.map((client) => (
                <ActivityCallout
                  body={`${client.stalled_threads_gt_72h} hilos estancados, ${client.open_actions} acciones abiertas, ${client.negative_signals_30d} señales neg.`}
                  key={client.id}
                  title={`${client.client_name} · ${formatHours(client.avg_team_response_hours_30d)}`}
                  tone={client.avg_team_response_hours_30d > 24 ? "warning" : "default"}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message="Cuando haya datos de respuesta, aparecerán aquí."
              title="Sin datos"
            />
          )}
        </section>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Cartera</p>
            <h3>Todos los clientes</h3>
          </div>
        </div>

        {isBooting ? (
          <div className="portfolio-table">
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
          </div>
        ) : dashboard?.clients.length ? (
          <div className="portfolio-table">
            <div className="portfolio-header">
              <span>Cliente</span>
              <span>Riesgo</span>
              <span>Respuesta equipo</span>
              <span>Hilos 72h+</span>
              <span>Acciones</span>
              <span>Señales neg.</span>
            </div>
            {dashboard.clients.map((client) => (
              <ClientListRow client={client} key={client.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="Carga datos para ver la cartera."
            title="Sin clientes"
          />
        )}
      </section>
    </>
  );
}
