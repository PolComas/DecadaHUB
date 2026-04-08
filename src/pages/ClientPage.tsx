import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteEmail,
  dismissClient,
  fetchClientDetail,
  fetchEmailFull,
  fetchMergeCandidates,
  fetchThreadMessages,
  mergeClients,
  unmergeClient,
} from "../lib/api";
import { directionLabel, formatDateTime, formatHours, priorityLabel, statusLabel } from "../lib/formatters";
import { useAppLayoutContext } from "../components/AppLayout";
import {
  ActivityCallout,
  CountChip,
  EmptyState,
  FocusMetric,
  InsightCard,
  RiskPill,
  SkeletonBlock,
  SkeletonTimeline,
  TimelineRow,
  durationMinutes,
  initials,
  avatarTone,
} from "../components/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClientDetail, EmailMessageFull, MergeCandidate } from "../types";

type DetailTab = "timeline" | "emails" | "insights" | "actions" | "threads" | "meetings" | "transcripts";

const TAB_CONFIG: { key: DetailTab; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "emails", label: "Correos" },
  { key: "insights", label: "Análisis" },
  { key: "actions", label: "Acciones" },
  { key: "threads", label: "Hilos" },
  { key: "meetings", label: "Reuniones" },
  { key: "transcripts", label: "Transcripciones" },
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

  // Merge dialog
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeCandidates, setMergeCandidates] = useState<MergeCandidate[]>([]);
  const [mergeSearch, setMergeSearch] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [isMergeLoading, setIsMergeLoading] = useState(false);

  // Email detail modal
  const [emailDetail, setEmailDetail] = useState<EmailMessageFull | null>(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);

  // Thread detail modal
  const [threadMessages, setThreadMessages] = useState<EmailMessageFull[] | null>(null);
  const [threadDetailSubject, setThreadDetailSubject] = useState<string>("");
  const [threadDetailLoading, setThreadDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; subject: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Merged clients collapsed
  const [mergedExpanded, setMergedExpanded] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    setDetailError(null);
    try {
      const response = await fetchClientDetail(clientId);
      setDetail(response);
    } catch (error) {
      setDetailError(toMessage(error));
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    void loadDetail().then(() => { if (cancelled) setDetail(null); });
    return () => { cancelled = true; };
  }, [loadDetail]);

  useEffect(() => {
    setActiveTab("timeline");
  }, [clientId]);

  // ── Handlers ──

  async function handleDismiss() {
    if (!clientId || !client) return;
    if (!window.confirm(`¿Descartar "${client.client_name}"? El dominio se añadirá a la lista de exclusiones.`)) return;
    setIsDismissing(true);
    try {
      await dismissClient(clientId, client.primary_domain);
      await refreshDashboard();
      navigate("/", { replace: true });
    } catch (error) {
      setDetailError(toMessage(error));
    } finally {
      setIsDismissing(false);
    }
  }

  async function openMergeDialog() {
    if (!clientId) return;
    setShowMergeDialog(true);
    setMergeSearch("");
    setIsMergeLoading(true);
    try {
      setMergeCandidates(await fetchMergeCandidates(clientId));
    } catch {
      setMergeCandidates([]);
    } finally {
      setIsMergeLoading(false);
    }
  }

  async function handleMerge(targetId: string, targetName: string) {
    if (!clientId || !client) return;
    if (!window.confirm(`¿Fusionar "${client.client_name}" con "${targetName}"? Todos los correos, reuniones y datos se moverán al cliente de destino.`)) return;
    setIsMerging(true);
    try {
      await mergeClients(clientId, targetId);
      await refreshDashboard();
      navigate(`/clients/${targetId}`, { replace: true });
    } catch (error) {
      setDetailError(toMessage(error));
    } finally {
      setIsMerging(false);
      setShowMergeDialog(false);
    }
  }

  async function handleOpenEmail(messageId: string) {
    setEmailDetailLoading(true);
    setEmailDetail(null);
    try {
      const full = await fetchEmailFull(messageId);
      setEmailDetail(full);
    } catch {
      setEmailDetail(null);
    } finally {
      setEmailDetailLoading(false);
    }
  }

  async function handleOpenThread(threadId: string, subject: string) {
    setThreadDetailLoading(true);
    setThreadMessages(null);
    setThreadDetailSubject(subject);
    try {
      const messages = await fetchThreadMessages(threadId);
      setThreadMessages(messages);
    } catch {
      setThreadMessages(null);
    } finally {
      setThreadDetailLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEmail(deleteTarget.id);
      // Remove from local state
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter((m) => m.id !== deleteTarget.id),
              timeline: prev.timeline.filter((e) => e.source_id !== deleteTarget.id),
            }
          : prev,
      );
      setDeleteTarget(null);
    } catch (error) {
      setDetailError(toMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleUnmerge(sourceId: string, sourceName: string) {
    if (!window.confirm(`¿Separar "${sourceName}"? El cliente se restaurará como activo. Los datos históricos se mantendrán en este cliente.`)) return;
    try {
      await unmergeClient(sourceId);
      await refreshDashboard();
      await loadDetail();
    } catch (error) {
      setDetailError(toMessage(error));
    }
  }

  const filteredMergeCandidates = mergeCandidates.filter((c) => {
    if (!mergeSearch.trim()) return true;
    const q = mergeSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.primary_domain ?? "").toLowerCase().includes(q);
  });

  const attentionCallout = useMemo(() => {
    if (!client) return null;
    if (client.overdue_actions > 0) {
      return { title: "Acciones vencidas", body: `${client.overdue_actions} acciones fuera de plazo que pueden impactar en la percepción del cliente.`, tone: "warning" as const };
    }
    if (client.stalled_threads_gt_72h > 0) {
      return { title: "Hilos estancados", body: `${client.stalled_threads_gt_72h} hilos llevan más de 72 h sin avanzar.`, tone: "warning" as const };
    }
    if (client.negative_signals_30d > 0) {
      return { title: "Señales a seguir", body: `Se han detectado ${client.negative_signals_30d} señales negativas en los últimos 30 días.`, tone: "default" as const };
    }
    return { title: "Relación estable", body: "No hay indicadores fuertes de riesgo inmediato.", tone: "default" as const };
  }, [client]);

  if (!clientId) {
    return (
      <section className="card">
        <EmptyState message="El identificador del cliente no es válido." title="Cliente no encontrado" />
      </section>
    );
  }

  if (!client && dashboard) {
    return (
      <section className="card">
        <EmptyState message="Este cliente no existe en la cartera cargada." title="Cliente no encontrado" />
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="detail-hero">
        <div className="detail-hero-copy">
          <div className="detail-breadcrumbs">
            <Link className="topbar-link" to="/">Dashboard</Link>
            <span>/</span>
            <span>{client?.client_name ?? "Cliente"}</span>
          </div>
          <div className="detail-title-row">
            <div>
              <h2 className="detail-title">{client?.client_name ?? "Cargando..."}</h2>
            </div>
            {client ? <RiskPill score={client.risk_score_heuristic} /> : null}
          </div>
          <p className="hero-text">
            {client?.notes ?? "Vista detallada de la cuenta con contexto operativo, cronología y seguimiento cualitativo."}
          </p>
        </div>
        <div className="detail-side-meta">
          <div className="session-chip">{client?.owner_name ?? "Sin responsable"}</div>
          <div className="session-chip muted">{client ? `${client.meetings_30d} reuniones / 30d` : "—"}</div>
          {client ? (
            <div className="detail-actions">
              <button className="ghost-button" onClick={() => void openMergeDialog()} type="button">Fusionar</button>
              <button className="ghost-button danger" disabled={isDismissing} onClick={() => void handleDismiss()} type="button">
                {isDismissing ? "Descartando..." : "Descartar"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* KPIs */}
      <section className="stats-grid detail-stats">
        <FocusMetric helper="Media en horas laborables" label="Respuesta equipo" value={client ? formatHours(client.avg_team_response_hours_30d) : "—"} />
        <FocusMetric helper="Tiempo hasta cualquier respuesta" label="Respuesta cliente" value={client ? formatHours(client.avg_client_response_hours_30d) : "—"} />
        <FocusMetric helper="Conversación bloqueada >72 h" label="Hilos estancados" value={client ? String(client.stalled_threads_gt_72h) : "—"} />
        <FocusMetric helper="IA últimos 30 días" label="Señales negativas" value={client ? String(client.negative_signals_30d) : "—"} />
      </section>

      {/* Attention callouts */}
      <section className="two-up two-up-wide">
        {attentionCallout ? <ActivityCallout body={attentionCallout.body} title={attentionCallout.title} tone={attentionCallout.tone} /> : null}
        <ActivityCallout
          body={client ? `${client.emails_sent_30d} enviados, ${client.emails_received_30d} recibidos, ${client.open_actions} acciones abiertas.` : "Sin contexto."}
          title="Resumen rápido"
        />
      </section>

      {/* Merged clients section (collapsible) */}
      {detail?.mergedClients && detail.mergedClients.length > 0 ? (
        <section className="merged-section">
          <button className="merged-section-toggle" onClick={() => setMergedExpanded((v) => !v)} type="button">
            <h4>{mergedExpanded ? "▾" : "▸"} Clientes fusionados ({detail.mergedClients.length})</h4>
          </button>
          {mergedExpanded && detail.mergedClients.map((mc) => (
            <div className="merged-item" key={mc.id}>
              <div className="merged-item-info">
                <strong>{mc.name}</strong>
                <span>{mc.primary_domain ?? "Sin dominio"}{mc.merged_at ? ` · Fusionado el ${formatDateTime(mc.merged_at)}` : ""}</span>
              </div>
              <button className="unmerge-btn" onClick={() => void handleUnmerge(mc.id, mc.name)} type="button">
                Separar
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {detailError ? (
        <section className="callout error">
          <strong>No se ha podido cargar la ficha del cliente.</strong>
          <p>{detailError}</p>
        </section>
      ) : null}

      {/* Tab navigation */}
      <nav className="tab-nav">
        {TAB_CONFIG.map((tab) => (
          <button className={`tab-button ${activeTab === tab.key ? "active" : ""}`} key={tab.key} onClick={() => setActiveTab(tab.key)} type="button">
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
              <h3>Actividad reciente</h3>
              <CountChip>{detail?.timeline.length ?? 0}</CountChip>
            </div>
            {isLoading ? <SkeletonTimeline /> : null}
            {!isLoading && !detail?.timeline.length ? (
              <EmptyState message="Cuando haya correos, reuniones o transcripciones, aparecerán aquí." title="Sin actividad" />
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
              <h3>Últimos mensajes</h3>
              <CountChip>{detail?.messages.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
            ) : detail?.messages.length ? (
              <div className="stack-list">
                {detail.messages.map((message) => (
                  <div className="list-card-wrapper" key={message.id}>
                    <div className="list-card" onClick={() => void handleOpenEmail(message.id)}>
                      <div className="list-title-line">
                        <strong>{message.subject ?? "Sin asunto"}</strong>
                        <span className={`thread-chip ${message.direction === "client_to_team" ? "client_to_team" : "team_to_client"}`}>
                          {directionLabel(message.direction)}
                        </span>
                      </div>
                      <p>{message.snippet ?? "Sin fragmento disponible."}</p>
                      <div className="list-footer email-footer">
                        <span>{formatDateTime(message.sent_at)}</span>
                        <button
                          className="delete-btn"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: message.id, subject: message.subject ?? "Sin asunto" }); }}
                          title="Eliminar correo"
                          type="button"
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Cuando haya correos vinculados, se verán aquí." title="Sin mensajes" />
            )}
          </>
        )}

        {activeTab === "insights" && (
          <>
            <div className="section-header">
              <h3>Lectura cualitativa</h3>
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
              <EmptyState message="Cuando la IA procese el contenido, aparecerá aquí." title="Sin análisis" />
            )}
          </>
        )}

        {activeTab === "actions" && (
          <>
            <div className="section-header">
              <h3>Acciones pendientes</h3>
              <CountChip>{detail?.actions.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
            ) : detail?.actions.length ? (
              <div className="stack-list">
                {detail.actions.map((action) => (
                  <div className="list-card" key={action.id}>
                    <div className="list-title-line">
                      <strong>{action.title}</strong>
                      <span className={`priority-dot ${action.priority}`} />
                    </div>
                    <p>{action.details ?? "Sin detalle."}</p>
                    <div className="list-footer">
                      <span>{priorityLabel(action.priority)}</span>
                      <span>{statusLabel(action.status)}</span>
                      <span>{formatDateTime(action.due_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay acciones abiertas." title="Sin acciones" />
            )}
          </>
        )}

        {activeTab === "threads" && (
          <>
            <div className="section-header">
              <h3>Hilos de correo</h3>
              <CountChip>{detail?.threads.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
            ) : detail?.threads.length ? (
              <div className="stack-list">
                {detail.threads.map((thread) => (
                  <div
                    className="list-card"
                    key={thread.id}
                    onClick={() => void handleOpenThread(thread.id, thread.subject ?? "Sin asunto")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="list-title-line">
                      <strong>{thread.subject ?? "Sin asunto"}</strong>
                      <span className={`thread-chip ${thread.status}`}>{statusLabel(thread.status)}</span>
                    </div>
                    <div className="list-footer">
                      <span>{thread.message_count} mensajes</span>
                      <span>{formatDateTime(thread.last_message_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay hilos disponibles." title="Sin hilos" />
            )}
          </>
        )}

        {activeTab === "meetings" && (
          <>
            <div className="section-header">
              <h3>Reuniones recientes</h3>
              <CountChip>{detail?.meetings.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
            ) : detail?.meetings.length ? (
              <div className="stack-list">
                {detail.meetings.map((meeting) => (
                  <div className="list-card" key={meeting.id}>
                    <strong>{meeting.title}</strong>
                    <p>{meeting.description ?? "Sin descripción."}</p>
                    <div className="list-footer">
                      <span>{formatDateTime(meeting.start_at)}</span>
                      <span>{durationMinutes(meeting.start_at, meeting.end_at)}</span>
                      <span>{statusLabel(meeting.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay reuniones registradas." title="Sin reuniones" />
            )}
          </>
        )}

        {activeTab === "transcripts" && (
          <>
            <div className="section-header">
              <h3>Transcripciones</h3>
              <CountChip>{detail?.transcripts.length ?? 0}</CountChip>
            </div>
            {isLoading ? (
              <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
            ) : detail?.transcripts.length ? (
              <div className="stack-list">
                {detail.transcripts.map((transcript) => (
                  <a className="list-card link-card" href={transcript.document_url ?? undefined} key={transcript.id} rel="noreferrer" target="_blank">
                    <strong>{transcript.file_name ?? "Transcripción"}</strong>
                    <p>{transcript.content_text.slice(0, 160)}...</p>
                    <div className="list-footer">
                      <span>{formatDateTime(transcript.transcript_at)}</span>
                      <span>{transcript.language_code ?? "—"}</span>
                      <span>{transcript.document_url ? "Abrir documento" : "Sin enlace"}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay transcripciones disponibles." title="Sin transcripciones" />
            )}
          </>
        )}
      </section>

      {/* ── Merge dialog ── */}
      {showMergeDialog && (
        <div className="dialog-backdrop" onClick={() => setShowMergeDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Fusionar cliente</h3>
              <button className="dialog-close" onClick={() => setShowMergeDialog(false)} type="button">&times;</button>
            </div>
            <p className="dialog-description">
              Selecciona el cliente de destino. Todos los correos, reuniones, análisis y acciones de
              <strong> {client?.client_name}</strong> se moverán al cliente seleccionado.
            </p>
            <input className="dialog-search" placeholder="Buscar cliente de destino..." value={mergeSearch} onChange={(e) => setMergeSearch(e.target.value)} autoFocus />
            <div className="dialog-list">
              {isMergeLoading ? (
                <div className="dialog-loading">Cargando clientes...</div>
              ) : filteredMergeCandidates.length === 0 ? (
                <div className="dialog-empty">No se ha encontrado ningún cliente.</div>
              ) : (
                filteredMergeCandidates.map((candidate) => (
                  <button className="dialog-item" disabled={isMerging} key={candidate.id} onClick={() => void handleMerge(candidate.id, candidate.name)} type="button">
                    <div className={`item-avatar sm ${avatarTone(candidate.name)}`}>{initials(candidate.name)}</div>
                    <div className="dialog-item-copy">
                      <strong>{candidate.name}</strong>
                      <span>{candidate.primary_domain ?? ""}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Email detail modal ── */}
      {(emailDetail || emailDetailLoading) && (
        <div className="dialog-backdrop" onClick={() => { setEmailDetail(null); setEmailDetailLoading(false); }}>
          <div className="dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{emailDetail?.subject ?? "Cargando..."}</h3>
              <button className="dialog-close" onClick={() => { setEmailDetail(null); setEmailDetailLoading(false); }} type="button">&times;</button>
            </div>
            <div className="dialog-body">
              {emailDetailLoading ? (
                <SkeletonBlock tall />
              ) : emailDetail ? (
                <>
                  <div className="email-detail-meta">
                    <span>{directionLabel(emailDetail.direction)}</span>
                    {emailDetail.sender_email ? <span>De: {emailDetail.sender_email}</span> : null}
                    <span>{formatDateTime(emailDetail.sent_at)}</span>
                  </div>
                  <div className="email-body-text">
                    {emailDetail.body_text || emailDetail.snippet || "Sin contenido."}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Thread detail modal ── */}
      {(threadMessages || threadDetailLoading) && (
        <div className="dialog-backdrop" onClick={() => { setThreadMessages(null); setThreadDetailLoading(false); }}>
          <div className="dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{threadDetailSubject}</h3>
              <button className="dialog-close" onClick={() => { setThreadMessages(null); setThreadDetailLoading(false); }} type="button">&times;</button>
            </div>
            <div className="dialog-body">
              {threadDetailLoading ? (
                <SkeletonBlock tall />
              ) : threadMessages?.length ? (
                threadMessages.map((msg) => (
                  <div className="thread-message" key={msg.id}>
                    <div className="thread-message-head">
                      <strong>{msg.sender_email ?? "Desconocido"}</strong>
                      <span className={`thread-chip ${msg.direction === "client_to_team" ? "client_to_team" : "team_to_client"}`}>
                        {directionLabel(msg.direction)}
                      </span>
                    </div>
                    <div className="thread-message-head">
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{formatDateTime(msg.sent_at)}</span>
                    </div>
                    <div className="thread-message-body">
                      {msg.body_text || msg.snippet || "Sin contenido."}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No se han encontrado mensajes en este hilo." title="Hilo vacío" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
      {deleteTarget && (
        <div className="dialog-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="dialog confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Eliminar correo</h3>
              <button className="dialog-close" onClick={() => setDeleteTarget(null)} type="button">&times;</button>
            </div>
            <div className="dialog-body">
              <p>¿Seguro que quieres eliminar el correo <strong>"{deleteTarget.subject}"</strong>? Esta acción no se puede deshacer.</p>
              <div className="confirm-actions">
                <button className="confirm-cancel" onClick={() => setDeleteTarget(null)} type="button">Cancelar</button>
                <button className="confirm-danger" disabled={isDeleting} onClick={() => void handleDeleteConfirm()} type="button">
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Se ha producido un error inesperado.";
}
