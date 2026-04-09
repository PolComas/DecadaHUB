import { formatDateTime, priorityLabel, statusLabel } from "../../../lib/formatters";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { ActionItem } from "../../../types";

interface ActionsTabProps {
  actions: ActionItem[];
  isLoading: boolean;
}

export default function ActionsTab({ actions, isLoading }: ActionsTabProps) {
  const { slice, page, totalPages, hasNext, hasPrev, setPage } = usePagination(actions, 10);

  return (
    <>
      <div className="section-header">
        <h3>Acciones pendientes</h3>
        <CountChip>{actions.length}</CountChip>
      </div>
      {isLoading ? (
        <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
      ) : actions.length ? (
        <>
          <div className="stack-list">
            {slice.map((action) => (
              <div className="list-card" key={action.id}>
                <div className="list-title-line">
                  <strong>{action.title}</strong>
                  <span className={`priority-dot ${action.priority}`} />
                </div>
                <p>{action.details ?? "Sin detalle."}</p>
                <div className="list-footer">
                  <span>{priorityLabel(action.priority)}</span>
                  <span>{statusLabel(action.status)}</span>
                  <span>{formatDateTime(action.due_at)}</span>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState message="No hay acciones abiertas." title="Sin acciones" />
      )}
    </>
  );
}
