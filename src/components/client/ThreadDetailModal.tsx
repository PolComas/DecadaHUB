import { directionLabel, formatDateTime } from "../../lib/formatters";
import { EmptyState, SkeletonBlock } from "../ui";
import type { EmailMessageFull } from "../../types";

interface ThreadDetailModalProps {
  subject: string;
  messages: EmailMessageFull[] | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function ThreadDetailModal({ subject, messages, isLoading, onClose }: ThreadDetailModalProps) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog wide" role="dialog" aria-modal="true" aria-labelledby="thread-detail-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3 id="thread-detail-title">{subject}</h3>
          <button className="dialog-close" onClick={onClose} type="button" aria-label="Cerrar">&times;</button>
        </div>
        <div className="dialog-body">
          {isLoading ? (
            <SkeletonBlock tall />
          ) : messages?.length ? (
            messages.map((msg) => (
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
  );
}
