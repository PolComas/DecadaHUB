import { avatarTone, initials } from "./ui";
import type { MergeCandidate } from "../types";

interface AssignClientDialogProps {
  title: string;
  description: string;
  candidates: MergeCandidate[];
  isLoading: boolean;
  isAssigning: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (clientId: string, clientName: string) => void;
  onClose: () => void;
}

export default function AssignClientDialog({
  title,
  description,
  candidates,
  isLoading,
  isAssigning,
  search,
  onSearchChange,
  onSelect,
  onClose,
}: AssignClientDialogProps) {
  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.primary_domain ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id="assign-dialog-title">{title}</h3>
          <button className="dialog-close" onClick={onClose} type="button" aria-label="Cerrar">
            &times;
          </button>
        </div>
        <p className="dialog-description">{description}</p>
        <input
          className="dialog-search"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
          aria-label="Buscar cliente"
        />
        <div className="dialog-list" role="listbox" aria-label="Clientes disponibles">
          {isLoading ? (
            <div className="dialog-loading">Cargando clientes...</div>
          ) : filtered.length === 0 ? (
            <div className="dialog-empty">No se ha encontrado ningún cliente.</div>
          ) : (
            filtered.map((candidate) => (
              <button
                className="dialog-item"
                disabled={isAssigning}
                key={candidate.id}
                onClick={() => onSelect(candidate.id, candidate.name)}
                type="button"
                role="option"
              >
                <div className={`item-avatar sm ${avatarTone(candidate.name)}`}>
                  {initials(candidate.name)}
                </div>
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
  );
}
