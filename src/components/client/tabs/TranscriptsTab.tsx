import { formatDateTime } from "../../../lib/formatters";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { Transcript } from "../../../types";

interface TranscriptsTabProps {
  deletingTranscriptId: string | null;
  transcripts: Transcript[];
  isLoading: boolean;
  onDeleteTranscript: (transcriptId: string, title: string) => void;
  onMoveTranscript: (transcript: Transcript) => void;
}

export default function TranscriptsTab({
  deletingTranscriptId,
  transcripts,
  isLoading,
  onDeleteTranscript,
  onMoveTranscript,
}: TranscriptsTabProps) {
  return (
    <>
      <div className="section-header">
        <h3>Transcripciones</h3>
        <CountChip>{transcripts.length}</CountChip>
      </div>
      {isLoading ? (
        <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
      ) : transcripts.length ? (
        <div className="stack-list">
          {transcripts.map((transcript) => (
            <div className="list-card" key={transcript.id}>
              <strong>{transcript.file_name ?? "Transcripción"}</strong>
              <p>{transcript.content_text.slice(0, 160)}...</p>
              <div className="list-footer transcript-footer">
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
                  className="ghost-button"
                  onClick={() => onMoveTranscript(transcript)}
                  style={{ fontSize: 12, padding: "4px 10px" }}
                  type="button"
                >
                  Mover a...
                </button>
                <button
                  className="delete-btn"
                  disabled={deletingTranscriptId === transcript.id}
                  onClick={() => onDeleteTranscript(transcript.id, transcript.file_name ?? "Transcripción")}
                  title="Eliminar transcripción"
                  type="button"
                >
                  {deletingTranscriptId === transcript.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No hay transcripciones disponibles." title="Sin transcripciones" />
      )}
    </>
  );
}
