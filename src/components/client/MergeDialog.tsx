import { avatarTone, initials } from "../ui";
import type { MergeCandidate } from "../../types";

interface MergeDialogProps {
  clientName: string;
  candidates: MergeCandidate[];
  isLoading: boolean;
  isMerging: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onMerge: (targetId: string, targetName: string) => void;
  onClose: () => void;
}

export default function MergeDialog({ clientName, candidates, isLoading, isMerging, search, onSearchChange, onMerge, onClose }: MergeDialogProps) {
  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.primary_domain ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="merge-dialog-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3 id="merge-dialog-title">Fusionar cliente</h3>
          <button className="dialog-close" onClick={onClose} type="button" aria-label="Cerrar">&times;</button>
        </div>
        <p className="dialog-description">
          Selecciona el cliente de destino. Todos los correos, reuniones, análisis y acciones de
          <strong> {clientName}</strong> se moverán al cliente seleccionado.
        </p>
        <input className="dialog-search" placeholder="Buscar cliente de destino..." value={search} onChange={(e) => onSearchChange(e.target.value)} autoFocus aria-label="Buscar cliente de destino" />
        <div className="dialog-list" role="listbox" aria-label="Clientes disponibles">
          {isLoading ? (
            <div className="dialog-loading">Cargando clientes...</div>
          ) : filtered.length === 0 ? (
            <div className="dialog-empty">No se ha encontrado ningún cliente.</div>
          ) : (
            filtered.map((candidate) => (
              <button className="dialog-item" disabled={isMerging} key={candidate.id} onClick={() => onMerge(candidate.id, candidate.name)} type="button" role="option">
                <div className={`item-avatar sm ${avatarTone(candidate.name)}`}>{initials(candidate.name)}</div>
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
