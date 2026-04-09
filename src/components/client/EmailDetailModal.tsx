import { directionLabel, formatDateTime } from "../../lib/formatters";
import { SkeletonBlock } from "../ui";
import type { EmailMessageFull } from "../../types";

interface EmailDetailModalProps {
  email: EmailMessageFull | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function EmailDetailModal({ email, isLoading, onClose }: EmailDetailModalProps) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog wide" role="dialog" aria-modal="true" aria-labelledby="email-detail-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3 id="email-detail-title">{email?.subject ?? "Cargando..."}</h3>
          <button className="dialog-close" onClick={onClose} type="button" aria-label="Cerrar">&times;</button>
        </div>
        <div className="dialog-body">
          {isLoading ? (
            <SkeletonBlock tall />
          ) : email ? (
            <>
              <div className="email-detail-meta">
                <span>{directionLabel(email.direction)}</span>
                {email.sender_email ? <span>De: {email.sender_email}</span> : null}
                <span>{formatDateTime(email.sent_at)}</span>
              </div>
              <div className="email-body-text">
                {email.body_text || email.snippet || "Sin contenido."}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
