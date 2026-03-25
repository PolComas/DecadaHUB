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
      <section className="hero-panel">
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>
              Portfolio Pulse
            </p>
            <h2 className="hero-title">
              Relació, resposta i risc per prioritzar millor el dia.
            </h2>
            <p className="hero-text">
              Vista de cartera amb mètriques clau. El detall de cada client inclou
              timeline, correus, senyals qualitatius i seguiment pendent.
            </p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <MetricCard
          label="Clients actius"
          note="Cartera visible"
          value={summary ? String(summary.totalClients) : "—"}
        />
        <MetricCard
          label="Emails 30d"
          note="Entrants + sortints"
          value={summary ? formatCompactNumber(summary.totalEmails30d) : "—"}
        />
        <MetricCard
          label="Resposta equip"
          note="Mitjana h. laborables"
          value={summary ? formatHours(summary.averageTeamResponseHours) : "—"}
        />
        <MetricCard
          label="Clients crítics"
          note="Risk score >= 6"
          value={summary ? String(summary.highRiskClients) : "—"}
        />
        <MetricCard
          label="Reunions 30d"
          note="Calendari consolidat"
          value={summary ? String(summary.totalMeetings30d) : "—"}
        />
        <MetricCard
          label="Accions obertes"
          note="Seguiment pendent"
          value={summary ? String(summary.openActions) : "—"}
        />
      </section>

      {globalError ? (
        <section className="callout error">
          <strong>No s'ha pogut carregar el dashboard.</strong>
          <p>{globalError}</p>
        </section>
      ) : null}

      <section className="two-up two-up-wide">
        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Priority Board</p>
              <h3>Clients a vigilar avui</h3>
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
                  <p>{client.notes ?? "Sense context addicional."}</p>
                  <div className="priority-metrics">
                    <span>{client.stalled_threads_gt_72h} fils estancats</span>
                    <span>{client.overdue_actions} accions vençudes</span>
                    <span>{client.negative_signals_30d} senyals neg.</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              message="Quan hi hagi clients carregats, apareixeran aquí."
              title="Sense clients"
            />
          )}
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Response Watch</p>
              <h3>Temps de resposta</h3>
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
                  body={`${client.stalled_threads_gt_72h} fils parats, ${client.open_actions} accions obertes, ${client.negative_signals_30d} senyals neg.`}
                  key={client.id}
                  title={`${client.client_name} · ${formatHours(client.avg_team_response_hours_30d)}`}
                  tone={client.avg_team_response_hours_30d > 24 ? "warning" : "default"}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message="Quan hi hagi dades de resposta, apareixerà aquí."
              title="Sense dades"
            />
          )}
        </section>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Portfolio</p>
            <h3>Tots els clients</h3>
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
              <span>Client</span>
              <span>Risc</span>
              <span>Resposta equip</span>
              <span>Fils 72h+</span>
              <span>Accions</span>
              <span>Senyals neg.</span>
            </div>
            {dashboard.clients.map((client) => (
              <ClientListRow client={client} key={client.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="Carrega dades per veure la cartera."
            title="Sense clients"
          />
        )}
      </section>
    </>
  );
}
