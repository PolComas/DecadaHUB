import { directionLabel, formatDateTime } from "../../../lib/formatters";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { EmailMessage } from "../../../types";

interface EmailsTabProps {
  messages: EmailMessage[];
  isLoading: boolean;
  onOpenEmail: (messageId: string) => void;
  onDeleteEmail: (id: string, subject: string) => void;
}

export default function EmailsTab({ messages, isLoading, onOpenEmail, onDeleteEmail }: EmailsTabProps) {
  const { slice, page, totalPages, hasNext, hasPrev, setPage } = usePagination(messages, 12);

  return (
    <>
      <div className="section-header">
        <h3>Últimos mensajes</h3>
        <CountChip>{messages.length}</CountChip>
      </div>
      {isLoading ? (
        <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
      ) : messages.length ? (
        <>
          <div className="stack-list">
            {slice.map((message) => (
              <div className="list-card-wrapper" key={message.id}>
                <div className="list-card" onClick={() => onOpenEmail(message.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenEmail(message.id); } }} role="button" tabIndex={0}>
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
                      onClick={(e) => { e.stopPropagation(); onDeleteEmail(message.id, message.subject ?? "Sin asunto"); }}
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
          <Pagination page={page} totalPages={totalPages} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState message="Cuando haya correos vinculados, se verán aquí." title="Sin mensajes" />
      )}
    </>
  );
}
