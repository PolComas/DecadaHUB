import { useNavigate, useParams } from "react-router-dom";
import {
  assignTranscriptToClient,
  deleteActionItem,
  deleteEmail,
  deleteInsight,
  deleteMeeting,
  deleteThread,
  deleteTranscript,
  dismissClient,
  fetchEmailFull,
  fetchMergeCandidates,
  fetchThreadMessages,
  mergeClients,
  unmergeClient,
  updateActionItem,
  updateThreadStatus,
} from "../lib/api";
import { toMessage } from "../lib/errors";
import { useAppLayoutContext } from "../components/AppLayout";
import { EmptyState } from "../components/ui";
import { useClientDetail } from "../hooks/useClientDetail";
import ConfirmDialog from "../components/ConfirmDialog";
import { useEffect, useState } from "react";
import type { EmailMessageFull, MergeCandidate, ThreadStatus, Transcript } from "../types";

import ClientHero from "../components/client/ClientHero";
import ClientKpis from "../components/client/ClientKpis";
import MergedClientsSection from "../components/client/MergedClientsSection";
import AssignClientDialog from "../components/AssignClientDialog";
import MergeDialog from "../components/client/MergeDialog";
import EmailDetailModal from "../components/client/EmailDetailModal";
import ThreadDetailModal from "../components/client/ThreadDetailModal";
import TimelineTab from "../components/client/tabs/TimelineTab";
import EmailsTab from "../components/client/tabs/EmailsTab";
import InsightsTab from "../components/client/tabs/InsightsTab";
import ActionsTab from "../components/client/tabs/ActionsTab";
import ThreadsTab from "../components/client/tabs/ThreadsTab";
import MeetingsTab from "../components/client/tabs/MeetingsTab";
import TranscriptsTab from "../components/client/tabs/TranscriptsTab";

type DetailTab = "timeline" | "emails" | "insights" | "actions" | "threads" | "meetings" | "transcripts";
type DeleteTargetKind = "email" | "insight" | "action" | "thread" | "meeting" | "transcript";

const TAB_CONFIG: { key: DetailTab; label: string }[] = [
  { key: "timeline", label: "Cronología" },
  { key: "emails", label: "Correos" },
  { key: "insights", label: "Análisis" },
  { key: "actions", label: "Acciones" },
  { key: "threads", label: "Hilos" },
  { key: "meetings", label: "Reuniones" },
  { key: "transcripts", label: "Transcripciones" },
];

function tabCount(tab: DetailTab, detail: { timeline: unknown[]; messages: unknown[]; insights: unknown[]; actions: unknown[]; threads: unknown[]; meetings: unknown[]; transcripts: unknown[] } | null): number {
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
  const { detail, setDetail, isLoading, detailError, setDetailError, loadDetail } = useClientDetail(clientId);
  const [activeTab, setActiveTab] = useState<DetailTab>("timeline");
  const [updatingActionIds, setUpdatingActionIds] = useState<string[]>([]);
  const [updatingThreadIds, setUpdatingThreadIds] = useState<string[]>([]);

  // Dismiss confirmation
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  // Merge dialog
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeCandidates, setMergeCandidates] = useState<MergeCandidate[]>([]);
  const [mergeSearch, setMergeSearch] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [isMergeLoading, setIsMergeLoading] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<{ id: string; name: string } | null>(null);

  // Move transcript dialog
  const [moveTranscript, setMoveTranscript] = useState<Transcript | null>(null);
  const [moveCandidates, setMoveCandidates] = useState<MergeCandidate[]>([]);
  const [moveCandidatesLoading, setMoveCandidatesLoading] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  // Unmerge confirmation
  const [unmergeTarget, setUnmergeTarget] = useState<{ id: string; name: string } | null>(null);

  // Email detail modal
  const [emailDetail, setEmailDetail] = useState<EmailMessageFull | null>(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);

  // Thread detail modal
  const [threadMessages, setThreadMessages] = useState<EmailMessageFull[] | null>(null);
  const [threadDetailSubject, setThreadDetailSubject] = useState("");
  const [threadDetailLoading, setThreadDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    kind: DeleteTargetKind;
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setActiveTab("timeline");
  }, [clientId]);

  // ── Handlers ──

  async function executeDismiss() {
    if (!clientId || !client) return;
    setIsDismissing(true);
    try {
      await dismissClient(clientId, client.primary_domain);
      await refreshDashboard();
      setShowDismissConfirm(false);
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

  function handleMergeSelect(targetId: string, targetName: string) {
    setShowMergeDialog(false);
    setMergeTarget({ id: targetId, name: targetName });
  }

  async function executeMerge() {
    if (!clientId || !client || !mergeTarget) return;
    setIsMerging(true);
    try {
      await mergeClients(clientId, mergeTarget.id);
      await refreshDashboard();
      setMergeTarget(null);
      navigate(`/clients/${mergeTarget.id}`, { replace: true });
    } catch (error) {
      setDetailError(toMessage(error));
    } finally {
      setIsMerging(false);
    }
  }

  async function handleOpenEmail(messageId: string) {
    setEmailDetailLoading(true);
    setEmailDetail(null);
    try {
      setEmailDetail(await fetchEmailFull(messageId));
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
      setThreadMessages(await fetchThreadMessages(threadId));
    } catch {
      setThreadMessages(null);
    } finally {
      setThreadDetailLoading(false);
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      switch (deleteTarget.kind) {
        case "email":
          await deleteEmail(deleteTarget.id);
          if (emailDetail?.id === deleteTarget.id) {
            setEmailDetail(null);
            setEmailDetailLoading(false);
          }
          break;
        case "insight":
          await deleteInsight(deleteTarget.id);
          break;
        case "action":
          await deleteActionItem(deleteTarget.id);
          break;
        case "thread":
          await deleteThread(deleteTarget.id);
          setThreadMessages(null);
          setThreadDetailLoading(false);
          break;
        case "meeting":
          await deleteMeeting(deleteTarget.id);
          break;
        case "transcript":
          await deleteTranscript(deleteTarget.id);
          break;
      }

      await refreshDashboard();
      await loadDetail();
      setDeleteTarget(null);
    } catch (error) {
      setDetailError(toMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleUpdateAction(actionId: string, updates: { status?: "open" | "in_progress" | "done" | "cancelled"; priority?: "low" | "medium" | "high" | "critical" }) {
    setUpdatingActionIds((prev) => [...prev, actionId]);
    try {
      const updated = await updateActionItem(actionId, updates);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              actions: prev.actions.map((action) => (action.id === actionId ? updated : action)),
            }
          : prev,
      );
      await refreshDashboard();
      await loadDetail();
    } catch (error) {
      setDetailError(toMessage(error));
      throw error;
    } finally {
      setUpdatingActionIds((prev) => prev.filter((id) => id !== actionId));
    }
  }

  async function handleUpdateThreadStatus(threadId: string, status: ThreadStatus) {
    setUpdatingThreadIds((prev) => [...prev, threadId]);
    try {
      const updated = await updateThreadStatus(threadId, status);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              threads: prev.threads.map((thread) => (thread.id === threadId ? updated : thread)),
            }
          : prev,
      );
      await refreshDashboard();
      await loadDetail();
    } catch (error) {
      setDetailError(toMessage(error));
      throw error;
    } finally {
      setUpdatingThreadIds((prev) => prev.filter((id) => id !== threadId));
    }
  }

  async function openMoveTranscriptDialog(transcript: Transcript) {
    setMoveTranscript(transcript);
    setMoveSearch("");
    setMoveCandidatesLoading(true);
    try {
      setMoveCandidates(await fetchMergeCandidates(clientId!));
    } catch {
      setMoveCandidates([]);
    } finally {
      setMoveCandidatesLoading(false);
    }
  }

  async function executeMoveTranscript(targetClientId: string) {
    if (!moveTranscript) return;
    setIsMoving(true);
    try {
      await assignTranscriptToClient(moveTranscript.id, targetClientId);
      setMoveTranscript(null);
      await refreshDashboard();
      await loadDetail();
    } catch (error) {
      setDetailError(toMessage(error));
    } finally {
      setIsMoving(false);
    }
  }

  async function executeUnmerge() {
    if (!unmergeTarget) return;
    try {
      await unmergeClient(unmergeTarget.id);
      await refreshDashboard();
      await loadDetail();
      setUnmergeTarget(null);
    } catch (error) {
      setDetailError(toMessage(error));
    }
  }

  // ── Guards ──

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

  // ── Render ──

  return (
    <>
      <ClientHero
        client={client}
        isDismissing={isDismissing}
        onDismiss={() => setShowDismissConfirm(true)}
        onOpenMergeDialog={() => void openMergeDialog()}
      />

      <ClientKpis client={client} />

      {detail?.mergedClients && detail.mergedClients.length > 0 ? (
        <MergedClientsSection
          mergedClients={detail.mergedClients}
          onUnmerge={(id, name) => setUnmergeTarget({ id, name })}
        />
      ) : null}

      {detailError ? (
        <section className="callout error">
          <strong>No se ha podido cargar la ficha del cliente.</strong>
          <p>{detailError}</p>
          <button className="ghost-button" onClick={() => void loadDetail()} style={{ marginTop: 8 }} type="button">Reintentar</button>
        </section>
      ) : null}

      {/* Tab navigation */}
      <nav className="tab-nav" role="tablist" aria-label="Secciones del cliente">
        {TAB_CONFIG.map((tab) => (
          <button
            className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
          >
            {tab.label}
            <span className="tab-badge">{tabCount(tab.key, detail)}</span>
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <section className="card fade-in" key={activeTab} role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "timeline" && <TimelineTab timeline={detail?.timeline ?? []} isLoading={isLoading} />}
        {activeTab === "emails" && (
          <EmailsTab
            clientName={client?.client_name ?? "cliente"}
            messages={detail?.messages ?? []}
            isLoading={isLoading}
            onOpenEmail={(id) => void handleOpenEmail(id)}
            onDeleteEmail={(id, subject) => setDeleteTarget({ id, kind: "email", label: subject })}
          />
        )}
        {activeTab === "insights" && (
          <InsightsTab
            deletingInsightId={isDeleting && deleteTarget?.kind === "insight" ? deleteTarget.id : null}
            insights={detail?.insights ?? []}
            isLoading={isLoading}
            onDeleteInsight={(id, summary) => setDeleteTarget({ id, kind: "insight", label: summary })}
          />
        )}
        {activeTab === "actions" && (
          <ActionsTab
            actions={detail?.actions ?? []}
            clientName={client?.client_name ?? "cliente"}
            deletingActionId={isDeleting && deleteTarget?.kind === "action" ? deleteTarget.id : null}
            isLoading={isLoading}
            updatingActionIds={updatingActionIds}
            onDeleteAction={(actionId, title) => setDeleteTarget({ id: actionId, kind: "action", label: title })}
            onUpdateAction={(actionId, updates) => handleUpdateAction(actionId, updates)}
          />
        )}
        {activeTab === "threads" && (
          <ThreadsTab
            deletingThreadId={isDeleting && deleteTarget?.kind === "thread" ? deleteTarget.id : null}
            threads={detail?.threads ?? []}
            isLoading={isLoading}
            updatingThreadIds={updatingThreadIds}
            onDeleteThread={(id, subject) => setDeleteTarget({ id, kind: "thread", label: subject })}
            onOpenThread={(id, subject) => void handleOpenThread(id, subject)}
            onUpdateThreadStatus={(threadId, status) => handleUpdateThreadStatus(threadId, status)}
          />
        )}
        {activeTab === "meetings" && (
          <MeetingsTab
            deletingMeetingId={isDeleting && deleteTarget?.kind === "meeting" ? deleteTarget.id : null}
            meetings={detail?.meetings ?? []}
            isLoading={isLoading}
            onDeleteMeeting={(meetingId, title) => setDeleteTarget({ id: meetingId, kind: "meeting", label: title })}
          />
        )}
        {activeTab === "transcripts" && (
          <TranscriptsTab
            deletingTranscriptId={isDeleting && deleteTarget?.kind === "transcript" ? deleteTarget.id : null}
            transcripts={detail?.transcripts ?? []}
            isLoading={isLoading}
            onDeleteTranscript={(transcriptId, title) => setDeleteTarget({ id: transcriptId, kind: "transcript", label: title })}
            onMoveTranscript={(transcript) => void openMoveTranscriptDialog(transcript)}
          />
        )}
      </section>

      {/* Modals */}
      {showMergeDialog && (
        <MergeDialog
          clientName={client?.client_name ?? ""}
          candidates={mergeCandidates}
          isLoading={isMergeLoading}
          isMerging={false}
          search={mergeSearch}
          onSearchChange={setMergeSearch}
          onMerge={handleMergeSelect}
          onClose={() => setShowMergeDialog(false)}
        />
      )}

      {(emailDetail || emailDetailLoading) && (
        <EmailDetailModal
          email={emailDetail}
          isLoading={emailDetailLoading}
          onClose={() => { setEmailDetail(null); setEmailDetailLoading(false); }}
        />
      )}

      {(threadMessages || threadDetailLoading) && (
        <ThreadDetailModal
          subject={threadDetailSubject}
          messages={threadMessages}
          isLoading={threadDetailLoading}
          onClose={() => { setThreadMessages(null); setThreadDetailLoading(false); }}
        />
      )}

      {moveTranscript && (
        <AssignClientDialog
          title="Mover transcripción"
          description={`Selecciona el cliente de destino para "${moveTranscript.file_name ?? "Transcripción"}". Los insights y acciones asociados también se moverán.`}
          candidates={moveCandidates}
          isLoading={moveCandidatesLoading}
          isAssigning={isMoving}
          search={moveSearch}
          onSearchChange={setMoveSearch}
          onSelect={(targetId) => void executeMoveTranscript(targetId)}
          onClose={() => setMoveTranscript(null)}
        />
      )}

      {/* Confirmation dialogs */}
      <ConfirmDialog
        open={showDismissConfirm}
        title="Descartar cliente"
        confirmLabel="Descartar"
        isLoading={isDismissing}
        onConfirm={() => void executeDismiss()}
        onCancel={() => setShowDismissConfirm(false)}
      >
        <p>¿Descartar <strong>"{client?.client_name}"</strong>? El dominio se añadirá a la lista de exclusiones.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!mergeTarget}
        title="Fusionar cliente"
        confirmLabel="Fusionar"
        confirmTone="accent"
        isLoading={isMerging}
        onConfirm={() => void executeMerge()}
        onCancel={() => setMergeTarget(null)}
      >
        <p>¿Fusionar <strong>"{client?.client_name}"</strong> con <strong>"{mergeTarget?.name}"</strong>? Todos los correos, reuniones y datos se moverán al cliente de destino.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!unmergeTarget}
        title="Separar cliente"
        confirmLabel="Separar"
        confirmTone="accent"
        onConfirm={() => void executeUnmerge()}
        onCancel={() => setUnmergeTarget(null)}
      >
        <p>¿Separar <strong>"{unmergeTarget?.name}"</strong>? El cliente se restaurará como activo. Los datos históricos se mantendrán en este cliente.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={
          deleteTarget?.kind === "email" ? "Eliminar correo"
            : deleteTarget?.kind === "insight" ? "Eliminar análisis"
            : deleteTarget?.kind === "action" ? "Eliminar acción"
            : deleteTarget?.kind === "thread" ? "Eliminar hilo"
            : deleteTarget?.kind === "meeting" ? "Eliminar reunión"
            : "Eliminar transcripción"
        }
        confirmLabel="Eliminar"
        isLoading={isDeleting}
        onConfirm={() => void executeDelete()}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>
          {deleteTarget?.kind === "thread"
            ? <>¿Seguro que quieres eliminar el hilo <strong>"{deleteTarget?.label}"</strong>? También se eliminarán sus mensajes asociados.</>
            : <>¿Seguro que quieres eliminar <strong>"{deleteTarget?.label}"</strong>? Esta acción no se puede deshacer.</>}
        </p>
      </ConfirmDialog>
    </>
  );
}
