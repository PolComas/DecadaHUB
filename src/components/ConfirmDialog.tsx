import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  confirmTone?: "danger" | "accent";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, children, confirmLabel, confirmTone = "danger", isLoading = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        className="dialog confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id="confirm-dialog-title">{title}</h3>
          <button className="dialog-close" onClick={onCancel} type="button" aria-label="Cerrar">&times;</button>
        </div>
        <div className="dialog-body">
          {children}
          <div className="confirm-actions">
            <button className="confirm-cancel" onClick={onCancel} ref={cancelRef} type="button">Cancelar</button>
            <button
              className={confirmTone === "accent" ? "confirm-accent" : "confirm-danger"}
              disabled={isLoading}
              onClick={onConfirm}
              type="button"
            >
              {isLoading ? "Procesando..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
