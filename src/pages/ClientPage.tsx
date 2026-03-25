import { Link, useNavigate, useParams } from "react-router-dom";
import { dismissClient, fetchClientDetail } from "../lib/api";
import { formatDateTime, formatHours, statusLabel } from "../lib/formatters";
import { useAppLayoutContext } from "../components/AppLayout";
import {
  ActivityCallout,
  CountChip,
  EmptyState,
  FocusMetric,
  InsightCard,
  RecentMessageCard,
  RiskPill,
  SkeletonBlock,
  SkeletonTimeline,
  TimelineRow,
  durationMinutes,
} from "../components/ui";
import { useEffect, useMemo, useState } from "react";
import type { ClientDetail } from "../types";

type DetailTab = "timeline" | "emails" | "insights" | "actions" | "threads" | "meetings" | "transcripts";

const TAB_CONFIG: { key: DetailTab; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "emails", label: "Emails" },
  { key: "insights", label: "Insights" },
  { key: "actions", label: "Accions" },
  { key: "threads", label: "Threads" },
  { key: "meetings", label: "Reunions" },
  { key: "transcripts", label: "Transcripts" },
];

function tabCount(tab: DetailTab, detail: ClientDetail | null): number {
  if (!detail) return 0;
  const map: Record<DetailTab, unknown[]> = {
    timeline: detail.timeline,
    emails: detail.messages,
    insights: detail.insights,
    actions: detail.actions,
    threads: detail.threads,
    meetings: detail.meetings,
    transcripts: detail.transcripts,
  };
  return map[tab].length;
}

export default function ClientPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { dashboard, refreshDashboard } = useAppLayoutContext();
  const client = dashboard?.clients.find((item) => item.id === clientId) ?? null;
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("timeline");
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    let isCancelled = false;

    async function run() {
      setIsLoading(true);
      setDetailError(null);

      try {
        const response = await fetchClientDetail(clientId!);
        if (!isCancelled) {
          setDetail(response);
        }
      } catch (error) {
        if (!isCancelled) {
          setDetailError(toMessage(error));
          setDetail(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      isCancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    setActiveTab("timeline");
  }, [clientId]);

  async function handleDismiss() {
    if (!clientId || !client) return;
    if (!window.confirm(`Descartar "${client.client_name}"? El domini s'afegirà a la llista d'exclusions.`)) return;

    setIsDismissing(true);
    try {
      await dismissClient(clientId, client.primary_domain);
      await refreshDashboard();
      navigate("/", { replace: true });
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Error descartant client.");
    } finally {
      setIsDismissing(false);
    }
  }

  const attentionCallout = useMemo(() => {
    if (!client) return null;

    if (client.overdue_actions > 0) {
      return {
        title: "Accions vençudes",
        body: `${client.overdue_actions} accions fora de termini que poden impactar la percepció del client.`,
        tone: "warning" as const,
      };
    }

    if (client.stalled_threads_gt_72h > 0) {
      return {
        title: "Fils estancats",
        body: `${client.stalled_threads_gt_72h} fils porten més de 72h sense avançar.`,
        tone: "warning" as const,
      };
    }

    if (client.negative_signals_30d > 0) {
      return {
        title: "Senyals a seguir",
        body: `S'han detectat ${client.negative_signals_30d} senyals negatius els últims 30 dies.`,
        tone: "default" as const,
      };
    }

    return {
      title: "Relació estable",
      body: "No hi ha indicadors forts de risc immediat.",
      tone: "default" as const,
    };
  }, [client]);

  if (!clientId) {
    return (
      <section className="card">
        <EmptyState message="L'identificador del client no és vàlid." title="Client no trobat" />
      </section>
    );
  }

  if (!client && dashboard) {
    return (
      <section className="card">
        <EmptyState message="Aquest client no existeix a la cartera carregada." title="Client no trobat" />
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="detail-hero">
        <div className="detail-hero-copy">
          <div className="detail-breadcrumbs">
            <Link className="topbar-link" to="/">
              Dashboard
            </Link>
            <span>/</span>
            <span>{client?.client_name ?? "Client"}</span>
          </div>

          <div className="detail-title-row">
            <div>
              <h2 className="detail-title">{client?.client_name ?? "Carregant..."}</h2>
            </div>
            {client ? <RiskPill score={client.risk_score_heuristic} /> : null}
          </div>

          <p className="hero-text">
            {client?.notes ??
              "Vista detallada del compte amb context operatiu, timeline i seguiment qualitatiu."}
          </p>
        </div>

        <div className="detail-side-meta">
          <div className="session-chip">{client?.owner_name ?? "Sense owner"}</div>
          <div className="session-chip muted">
            {client ? `${client.meetings_30d} reunions / 30d` : "—"}
          </div>
          {client ? (
            <button
              className="ghost-button danger"
              disabled={isDismissing}
              onClick={() => void handleDismiss()}
              type="button"
            >
              {isDismissing ? "Descartant..." : "Descartar client"}
            </button>
          ) : null}
        </div>
      </section>

      {/* KPIs */}
      <section className="stats-grid detail-stats">
        <FocusMetric
          helper="Mitjana en hores laborables"
          label="Resposta equip"
          value={client ? formatHours(client.avg_team_response_hours_30d) : "—"}
        />
        <FocusMetric
          helper="Temps fins a qualsevol resposta"
          label="Resposta client"
          value={client ? formatHours(client.avg_client_response_hours_30d) : "—"}
        />
        <FocusMetric
          helper="Conversa bloquejada >72h"
          label="Fils estancats"
          value={client ? String(client.stalled_threads_gt_72h) : "—"}
        />
        <FocusMetric
          helper="IA últims 30 dies"
          label="Senyals negatius"
          value={client ? String(client.negative_signals_30d) : "—"}
        />
      </section>

      {/* Attention callouts */}
      <section className="two-up two-up-wide">
        {attentionCallout ? (
          <ActivityCallout
            body={attentionCallout.body}
            title={attentionCallout.title}
            tone={attentionCallout.tone}
          />
        ) : null}
        <ActivityCallout
          body={
            client
              ? `${client.emails_sent_30d} enviats, ${client.emails_received_30d} rebuts, ${client.open_actions} accions obertes.`
              : "Sense context."
          }
          title="Foto ràpida"
        />
      </section>

      {detailError ? (
        <section className="callout error">
          <strong>No s'ha pogut carregar la fitxa del client.</strong>
          <p>{detailError}</p>
        </section>
      ) : null}

      {/* Tab navigation */}
      <nav className="tab-nav">
        {TAB_CONFIG.map((tab) => (
          <button
            className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
            <span className="tab-badge">{tabCount(tab.key, detail)}</span>
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <section className="card fade-in" key={activeTab}>
        {activeTab === "timeline" && (
          <>
            <div className="section-header">
              <h3>Activitat recent</h3>
              <CountChip>{detail?.timeline.length ?? 0}</CountChip>
            </div>
            {isLoading ? <SkeletonTimeline /> : null}
            {!isLoading && !detail?.timeline.length ? (
              <EmptyState
                message="Quan hi hagi correus, reunions o transcripts, apareixeran aquí."
                title="Sense activitat"
              />
            ) : null}
            {!isLoading && detail?.timeline.length ? (
              <div className="timeline">
                {detail.timeline.map((event) => (
                  <TimelineRow event={event} key={`${event.event_type}-${event.source_id}`} />
                ))}
              </div>
            ) : null}
          </>
        )}

        {activeTab === "emails" && (
          <>
            <div className="section-header">
              <h3>Últims missatges</h3>
              <CountChip>{detail?.messages.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list">
                <SkeletonBlock />
                <SkeletonBlock />
              </div>
            ) : detail?.messages.length ? (
              <div className="stack-list">
                {detail.messages.map((message) => (
                  <RecentMessageCard key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <EmptyState
                message="Quan hi hagi emails vinculats, es veuran aquí."
                title="Sense missatges"
              />
            )}
          </>
        )}

        {activeTab === "insights" && (
          <>
            <div className="section-header">
              <h3>Lectura qualitativa</h3>
              <CountChip>{detail?.insights.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <SkeletonBlock tall />
            ) : detail?.insights.length ? (
              <div className="stack-list">
                {detail.insights.map((insight) => (
                  <InsightCard insight={insight} key={insight.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                message="Quan la IA processi el contingut, apareixerà aquí."
                title="Sense insights"
              />
            )}
          </>
        )}

        {activeTab === "actions" && (
          <>
            <div className="section-header">
              <h3>Accions pendents</h3>
              <CountChip>{detail?.actions.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list">
                <SkeletonBlock />
                <SkeletonBlock />
              </div>
            ) : detail?.actions.length ? (
              <div className="stack-list">
                {detail.actions.map((action) => (
                  <div className="list-card" key={action.id}>
                    <div className="list-title-line">
                      <strong>{action.title}</strong>
                      <span className={`priority-dot ${action.priority}`} />
                    </div>
                    <p>{action.details ?? "Sense detall."}</p>
                    <div className="list-footer">
                      <span>{action.priority}</span>
                      <span>{statusLabel(action.status)}</span>
                      <span>{formatDateTime(action.due_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hi ha accions obertes." title="Sense accions" />
            )}
          </>
        )}

        {activeTab === "threads" && (
          <>
            <div className="section-header">
              <h3>Fils de correu</h3>
              <CountChip>{detail?.threads.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list">
                <SkeletonBlock />
                <SkeletonBlock />
              </div>
            ) : detail?.threads.length ? (
              <div className="stack-list">
                {detail.threads.map((thread) => (
                  <div className="list-card" key={thread.id}>
                    <div className="list-title-line">
                      <strong>{thread.subject ?? "Sense assumpte"}</strong>
                      <span className={`thread-chip ${thread.status}`}>
                        {statusLabel(thread.status)}
                      </span>
                    </div>
                    <div className="list-footer">
                      <span>{thread.message_count} missatges</span>
                      <span>{formatDateTime(thread.last_message_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hi ha fils disponibles." title="Sense threads" />
            )}
          </>
        )}

        {activeTab === "meetings" && (
          <>
            <div className="section-header">
              <h3>Reunions recents</h3>
              <CountChip>{detail?.meetings.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list">
                <SkeletonBlock />
                <SkeletonBlock />
              </div>
            ) : detail?.meetings.length ? (
              <div className="stack-list">
                {detail.meetings.map((meeting) => (
                  <div className="list-card" key={meeting.id}>
                    <strong>{meeting.title}</strong>
                    <p>{meeting.description ?? "Sense descripció."}</p>
                    <div className="list-footer">
                      <span>{formatDateTime(meeting.start_at)}</span>
                      <span>{durationMinutes(meeting.start_at, meeting.end_at)}</span>
                      <span>{meeting.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hi ha reunions registrades." title="Sense reunions" />
            )}
          </>
        )}

        {activeTab === "transcripts" && (
          <>
            <div className="section-header">
              <h3>Transcripcions</h3>
              <CountChip>{detail?.transcripts.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list">
                <SkeletonBlock />
                <SkeletonBlock />
              </div>
            ) : detail?.transcripts.length ? (
              <div className="stack-list">
                {detail.transcripts.map((transcript) => (
                  <a
                    className="list-card link-card"
                    href={transcript.document_url ?? undefined}
                    key={transcript.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <strong>{transcript.file_name ?? "Transcript"}</strong>
                    <p>{transcript.content_text.slice(0, 160)}...</p>
                    <div className="list-footer">
                      <span>{formatDateTime(transcript.transcript_at)}</span>
                      <span>{transcript.language_code ?? "—"}</span>
                      <span>{transcript.document_url ? "Obrir doc" : "Sense enllaç"}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState message="No hi ha transcripts disponibles." title="Sense transcripts" />
            )}
          </>
        )}
      </section>
    </>
  );
}

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "S'ha produït un error inesperat.";
}
