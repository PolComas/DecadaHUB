import { useNavigate, useParams } from "react-router-dom";
import {
  deleteEmail,
  dismissClient,
  fetchEmailFull,
  fetchMergeCandidates,
  fetchThreadMessages,
  mergeClients,
  unmergeClient,
  updateActionItem,
  updateClientNotes,
  updateClientOwner,
} from "../lib/api";
import { toMessage } from "../lib/errors";
import { useAppLayoutContext } from "../components/AppLayout";
import { EmptyState } from "../components/ui";
import { useClientDetail } from "../hooks/useClientDetail";
import ConfirmDialog from "../components/ConfirmDialog";
import { useEffect, useState } from "react";
import type { EmailMessageFull, MergeCandidate } from "../types";

import ClientHero from "../components/client/ClientHero";
import ClientKpis from "../components/client/ClientKpis";
import MergedClientsSection from "../components/client/MergedClientsSection";
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
  const teamMembers = dashboard?.teamMembers ?? [];
  const { detail, setDetail, isLoading, detailError, setDetailError, loadDetail } = useClientDetail(clientId);
  const [activeTab, setActiveTab] = useState<DetailTab>("timeline");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [updatingActionIds, setUpdatingActionIds] = useState<string[]>([]);

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; subject: string } | null>(null);
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

  async function handleSaveNotes(notes: string) {
    if (!clientId) return;
    setIsSavingNotes(true);
    try {
      await updateClientNotes(clientId, notes);
      await refreshDashboard();
    } catch (error) {
      setDetailError(toMessage(error));
      throw error;
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function handleSaveOwner(ownerTeamMemberId: string | null) {
    if (!clientId) return;
    setIsSavingOwner(true);
    try {
      await updateClientOwner(clientId, ownerTeamMemberId);
      await refreshDashboard();
    } catch (error) {
      setDetailError(toMessage(error));
      throw error;
    } finally {
      setIsSavingOwner(false);
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
      await deleteEmail(deleteTarget.id);
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
    } catch (error) {
      setDetailError(toMessage(error));
      throw error;
    } finally {
      setUpdatingActionIds((prev) => prev.filter((id) => id !== actionId));
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
        isSavingNotes={isSavingNotes}
        isSavingOwner={isSavingOwner}
        onDismiss={() => setShowDismissConfirm(true)}
        onOpenMergeDialog={() => void openMergeDialog()}
        onSaveNotes={(notes) => handleSaveNotes(notes)}
        onSaveOwner={(ownerTeamMemberId) => handleSaveOwner(ownerTeamMemberId)}
        teamMembers={teamMembers}
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
            onDeleteEmail={(id, subject) => setDeleteTarget({ id, subject })}
          />
        )}
        {activeTab === "insights" && <InsightsTab insights={detail?.insights ?? []} isLoading={isLoading} />}
        {activeTab === "actions" && (
          <ActionsTab
            actions={detail?.actions ?? []}
            clientName={client?.client_name ?? "cliente"}
            isLoading={isLoading}
            updatingActionIds={updatingActionIds}
            onUpdateAction={(actionId, updates) => handleUpdateAction(actionId, updates)}
          />
        )}
        {activeTab === "threads" && <ThreadsTab threads={detail?.threads ?? []} isLoading={isLoading} onOpenThread={(id, subject) => void handleOpenThread(id, subject)} />}
        {activeTab === "meetings" && <MeetingsTab meetings={detail?.meetings ?? []} isLoading={isLoading} />}
        {activeTab === "transcripts" && <TranscriptsTab transcripts={detail?.transcripts ?? []} isLoading={isLoading} />}
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
        title="Eliminar correo"
        confirmLabel="Eliminar"
        isLoading={isDeleting}
        onConfirm={() => void executeDelete()}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>¿Seguro que quieres eliminar el correo <strong>"{deleteTarget?.subject}"</strong>? Esta acción no se puede deshacer.</p>
      </ConfirmDialog>
    </>
  );
}
