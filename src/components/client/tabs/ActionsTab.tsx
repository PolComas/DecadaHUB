import { currentDateStamp, downloadCsv, safeFilenamePart } from "../../../lib/csv";
import { priorityLabel, statusLabel } from "../../../lib/formatters";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { ActionItem, ActionPriority, ActionStatus } from "../../../types";

interface ActionsTabProps {
  actions: ActionItem[];
  clientName: string;
  deletingActionId: string | null;
  isLoading: boolean;
  updatingActionIds: string[];
  onDeleteAction: (actionId: string, title: string) => void;
  onUpdateAction: (
    actionId: string,
    updates: Partial<Pick<ActionItem, "status" | "priority">>,
  ) => Promise<void>;
}

const STATUS_OPTIONS: ActionStatus[] = ["open", "in_progress", "done", "cancelled"];
const PRIORITY_OPTIONS: ActionPriority[] = ["low", "medium", "high", "critical"];

function statusTone(status: ActionStatus) {
  const tones: Record<ActionStatus, string> = {
    open: "status-open",
    in_progress: "status-in-progress",
    done: "status-done",
    cancelled: "status-cancelled",
  };

  return tones[status];
}

function priorityTone(priority: ActionPriority) {
  const tones: Record<ActionPriority, string> = {
    low: "priority-low",
    medium: "priority-medium",
    high: "priority-high",
    critical: "priority-critical",
  };

  return tones[priority];
}

export default function ActionsTab({
  actions,
  clientName,
  deletingActionId,
  isLoading,
  updatingActionIds,
  onDeleteAction,
  onUpdateAction,
}: ActionsTabProps) {
  const { slice, page, totalPages, hasNext, hasPrev, setPage } = usePagination(actions, 10);

  function handleExportCsv() {
    downloadCsv<ActionItem>(
      `${safeFilenamePart(clientName)}-acciones-${currentDateStamp()}.csv`,
      [
        { header: "Título", value: (action) => action.title },
        { header: "Detalle", value: (action) => action.details ?? "" },
        { header: "Estado", value: (action) => statusLabel(action.status) },
        { header: "Prioridad", value: (action) => priorityLabel(action.priority) },
        { header: "Vence el", value: (action) => action.due_at ?? "" },
      ],
      actions,
    );
  }

  return (
    <>
      <div className="section-header">
        <h3>Acciones</h3>
        <div className="section-actions">
          {actions.length ? (
            <button className="ghost-button" onClick={handleExportCsv} type="button">
              Exportar CSV
            </button>
          ) : null}
          <CountChip>{actions.length}</CountChip>
        </div>
      </div>
      {isLoading ? (
        <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
      ) : actions.length ? (
        <>
          <div className="stack-list">
            {slice.map((action) => {
              const isUpdating = updatingActionIds.includes(action.id);

              return (
                <article
                  className={`list-card action-row ${statusTone(action.status)} ${isUpdating ? "is-updating" : ""}`}
                  key={action.id}
                >
                  <div className="action-row-header">
                    <div className="action-row-copy">
                      <strong>{action.title}</strong>
                      {action.details ? <p>{action.details}</p> : null}
                      {isUpdating ? <span className="action-row-saving">Guardando...</span> : null}
                    </div>

                    <div className="action-row-controls">
                      <select
                        className={`action-pill-select ${priorityTone(action.priority)}`}
                        aria-label="Prioridad de la acción"
                        disabled={isUpdating}
                        value={action.priority}
                        onChange={(event) =>
                          void onUpdateAction(action.id, { priority: event.target.value as ActionPriority })
                        }
                      >
                        {PRIORITY_OPTIONS.map((priority) => (
                          <option key={priority} value={priority}>
                            {priorityLabel(priority)}
                          </option>
                        ))}
                      </select>

                      <select
                        className={`action-pill-select ${statusTone(action.status)}`}
                        aria-label="Estado de la acción"
                        disabled={isUpdating}
                        value={action.status}
                        onChange={(event) =>
                          void onUpdateAction(action.id, { status: event.target.value as ActionStatus })
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>

                      <button
                        className="ghost-button action-delete-btn"
                        disabled={deletingActionId === action.id}
                        onClick={() => onDeleteAction(action.id, action.title)}
                        title="Eliminar acción"
                        type="button"
                      >
                        {deletingActionId === action.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState message="No hay acciones abiertas." title="Sin acciones" />
      )}
    </>
  );
}
