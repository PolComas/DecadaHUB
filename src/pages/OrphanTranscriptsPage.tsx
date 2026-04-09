import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  assignTranscriptToClient,
  deleteTranscript,
  fetchMergeCandidates,
  fetchOrphanTranscripts,
} from "../lib/api";
import { formatDateTime } from "../lib/formatters";
import { EmptyState } from "../components/ui";
import AssignClientDialog from "../components/AssignClientDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import type { MergeCandidate, Transcript } from "../types";

export default function OrphanTranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign dialog state
  const [assignTarget, setAssignTarget] = useState<Transcript | null>(null);
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Transcript | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    try {
      const data = await fetchOrphanTranscripts();
      setTranscripts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar transcripciones.");
    } finally {
      setIsLoading(false);
    }
  }

  async function openAssignDialog(transcript: Transcript) {
    setAssignTarget(transcript);
    setAssignSearch("");
    setCandidatesLoading(true);
    try {
      const data = await fetchMergeCandidates("__none__");
      setCandidates(data);
    } catch {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }

  async function handleAssign(clientId: string) {
    if (!assignTarget) return;
    setIsAssigning(true);
    try {
      await assignTranscriptToClient(assignTarget.id, clientId);
      setTranscripts((prev) => prev.filter((t) => t.id !== assignTarget.id));
      setAssignTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar transcripción.");
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTranscript(deleteTarget.id);
      setTranscripts((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar transcripción.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="page-header-copy">
          <div className="detail-breadcrumbs" style={{ color: "var(--text-tertiary)" }}>
            <Link className="topbar-link" to="/">Panel</Link>
            <span>/</span>
            <span>Transcripciones sin asignar</span>
          </div>
          <h2 className="page-title">Transcripciones sin asignar</h2>
          <p className="page-subtitle">
            Transcripciones que no se han podido vincular automáticamente a ningún cliente.
            Puedes asignarlas manualmente al cliente correcto.
          </p>
        </div>
      </section>

      {error && (
        <section className="callout error">
          <strong>Error</strong>
          <p>{error}</p>
          <button className="ghost-button" onClick={() => void load()} style={{ marginTop: 8 }} type="button">
            Reintentar
          </button>
        </section>
      )}

      <section className="card">
        {isLoading ? (
          <div className="stack-list">
            <div className="skeleton-block" />
            <div className="skeleton-block" />
            <div className="skeleton-block" />
          </div>
        ) : transcripts.length === 0 ? (
          <EmptyState
            title="Todo asignado"
            message="No hay transcripciones pendientes de asignar. Cuando n8n no pueda vincular una transcripción a un cliente, aparecerá aquí."
          />
        ) : (
          <div className="stack-list">
            {transcripts.map((transcript) => (
              <div className="list-card" key={transcript.id}>
                <strong>{transcript.file_name ?? "Transcripción"}</strong>
                <p>{transcript.content_text.slice(0, 160)}...</p>
                <div className="list-footer">
                  <span>{formatDateTime(transcript.transcript_at)}</span>
                  <span>{transcript.language_code ?? "—"}</span>
                  {transcript.document_url ? (
                    <a
                      className="text-link transcript-link"
                      href={transcript.document_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir documento
                    </a>
                  ) : (
                    <span>Sin enlace</span>
                  )}
                  <button
                    className="restore-button"
                    onClick={() => void openAssignDialog(transcript)}
                    type="button"
                  >
                    Asignar a cliente
                  </button>
                  <button
                    className="delete-btn"
                    style={{ opacity: 1 }}
                    onClick={() => setDeleteTarget(transcript)}
                    title="Eliminar transcripción"
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {assignTarget && (
        <AssignClientDialog
          title="Asignar transcripción"
          description={`Selecciona el cliente al que pertenece "${assignTarget.file_name ?? "Transcripción"}". Los insights y acciones generados también se moverán.`}
          candidates={candidates}
          isLoading={candidatesLoading}
          isAssigning={isAssigning}
          search={assignSearch}
          onSearchChange={setAssignSearch}
          onSelect={(clientId) => void handleAssign(clientId)}
          onClose={() => setAssignTarget(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar transcripción"
        confirmLabel="Eliminar"
        confirmTone="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>
          ¿Eliminar <strong>"{deleteTarget?.file_name ?? "Transcripción"}"</strong>?
          Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </>
  );
}
