import { formatDateTime } from "../../../lib/formatters";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { Transcript } from "../../../types";

interface TranscriptsTabProps {
  transcripts: Transcript[];
  isLoading: boolean;
}

export default function TranscriptsTab({ transcripts, isLoading }: TranscriptsTabProps) {
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
  );
}
