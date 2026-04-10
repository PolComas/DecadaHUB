import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { currentDateStamp, downloadCsv } from "../lib/csv";
import { formatCompactNumber, formatHours } from "../lib/formatters";
import { useAppLayoutContext } from "../components/AppLayout";
import DashboardFilters, { EMPTY_FILTERS, filterClients, type DashboardFilterState } from "../components/DashboardFilters";
import RiskDistributionChart from "../components/charts/RiskDistributionChart";
import {
  ActivityCallout,
  ClientListRow,
  EmptyState,
  MetricCard,
  RiskPill,
  SkeletonBlock,
} from "../components/ui";
import type { ClientOverview, DashboardSummary } from "../types";

export default function DashboardPage() {
  const { filteredClients, isBooting, globalError, refreshDashboard } = useAppLayoutContext();
  const [filters, setFilters] = useState<DashboardFilterState>(EMPTY_FILTERS);

  const summary = useMemo((): DashboardSummary | null => {
    if (filteredClients.length === 0) return null;
    const responseHours = filteredClients.map((c) => c.avg_team_response_hours_30d).filter((v) => v > 0);
    return {
      totalClients: filteredClients.length,
      totalEmails30d: filteredClients.reduce((s, c) => s + c.emails_sent_30d + c.emails_received_30d, 0),
      totalMeetings30d: filteredClients.reduce((s, c) => s + c.meetings_30d, 0),
      averageTeamResponseHours: responseHours.length
        ? responseHours.reduce((a, v) => a + v, 0) / responseHours.length
        : 0,
      highRiskClients: filteredClients.filter((c) => c.risk_score_heuristic >= 6).length,
      openActions: filteredClients.reduce((s, c) => s + c.open_actions, 0),
    };
  }, [filteredClients]);

  const allClients = filteredClients;

  const displayClients = useMemo(
    () => filterClients(allClients, filters),
    [allClients, filters],
  );

  const topRiskClients = displayClients.slice(0, 3);
  const slowestTeamReplies = useMemo(
    () => displayClients
      .filter((client) => client.avg_team_response_hours_30d > 0)
      .sort((a, b) => b.avg_team_response_hours_30d - a.avg_team_response_hours_30d)
      .slice(0, 4),
    [displayClients],
  );

  function handleExportPortfolioCsv() {
    downloadCsv<ClientOverview>(
      `cartera-${currentDateStamp()}.csv`,
      [
        { header: "Cliente", value: (client) => client.client_name },
        { header: "Riesgo", value: (client) => client.risk_score_heuristic },
        { header: "Respuesta equipo (h)", value: (client) => client.avg_team_response_hours_30d },
        { header: "Hilos 72h+", value: (client) => client.stalled_threads_gt_72h },
        { header: "Acciones abiertas", value: (client) => client.open_actions },
        { header: "Acciones vencidas", value: (client) => client.overdue_actions },
        { header: "Señales negativas 30d", value: (client) => client.negative_signals_30d },
      ],
      displayClients,
    );
  }

  return (
    <>
      <section className="dashboard-header">
        <div className="dashboard-header-copy">
          <h2>Panel general</h2>
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
          <button className="ghost-button" onClick={() => void refreshDashboard()} style={{ marginTop: 8 }} type="button">Reintentar</button>
        </section>
      ) : null}

      {!isBooting && allClients.length > 0 ? (
        <DashboardFilters clients={allClients} filters={filters} onChange={setFilters} />
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
              <p className="eyebrow">Distribución de riesgo</p>
              <h3>Estado de la cartera</h3>
            </div>
          </div>

          {isBooting ? (
            <SkeletonBlock tall />
          ) : displayClients.length ? (
            <RiskDistributionChart clients={displayClients} />
          ) : null}

          {!isBooting && slowestTeamReplies.length ? (
            <>
              <div className="section-header compact" style={{ marginTop: 14 }}>
                <h3>Respuestas más lentas</h3>
              </div>
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
            </>
          ) : null}
        </section>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Cartera</p>
            <h3>Todos los clientes ({displayClients.length})</h3>
          </div>
          {displayClients.length ? (
            <button className="ghost-button" onClick={handleExportPortfolioCsv} type="button">
              Exportar CSV
            </button>
          ) : null}
        </div>

        {isBooting ? (
          <div className="portfolio-table">
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
          </div>
        ) : displayClients.length ? (
          <div className="portfolio-table">
            <div className="portfolio-header">
              <span>Cliente</span>
              <span>Riesgo</span>
              <span>Respuesta equipo</span>
              <span>Hilos 72h+</span>
              <span>Acciones</span>
              <span>Señales neg.</span>
            </div>
            {displayClients.map((client) => (
              <ClientListRow client={client} key={client.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="Ningún cliente coincide con los filtros aplicados."
            title="Sin resultados"
          />
        )}
      </section>
    </>
  );
}
