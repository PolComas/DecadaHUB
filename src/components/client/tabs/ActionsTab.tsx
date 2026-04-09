import { currentDateStamp, downloadCsv, safeFilenamePart } from "../../../lib/csv";
import { formatDateTime, priorityLabel, statusLabel } from "../../../lib/formatters";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { ActionItem, ActionPriority, ActionStatus } from "../../../types";

interface ActionsTabProps {
  actions: ActionItem[];
  clientName: string;
  isLoading: boolean;
  updatingActionIds: string[];
  onUpdateAction: (
    actionId: string,
    updates: Partial<Pick<ActionItem, "status" | "priority">>,
  ) => Promise<void>;
}

const STATUS_OPTIONS: ActionStatus[] = ["open", "in_progress", "done", "cancelled"];
const PRIORITY_OPTIONS: ActionPriority[] = ["low", "medium", "high", "critical"];

export default function ActionsTab({
  actions,
  clientName,
  isLoading,
  updatingActionIds,
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
            {slice.map((action) => (
              <div className="list-card" key={action.id}>
                <div className="list-title-line">
                  <strong>{action.title}</strong>
                  <span className={`priority-dot ${action.priority}`} />
                </div>
                <p>{action.details ?? "Sin detalle."}</p>
                <div className="list-footer action-footer">
                  <span>{formatDateTime(action.due_at)}</span>
                </div>
                <div className="action-controls">
                  <label className="action-control-group">
                    <span>Estado</span>
                    <select
                      className="inline-select"
                      disabled={updatingActionIds.includes(action.id)}
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
                  </label>

                  <label className="action-control-group">
                    <span>Prioridad</span>
                    <select
                      className="inline-select"
                      disabled={updatingActionIds.includes(action.id)}
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
                  </label>

                  {action.status !== "done" ? (
                    <button
                      className="ghost-button action-done-button"
                      disabled={updatingActionIds.includes(action.id)}
                      onClick={() => void onUpdateAction(action.id, { status: "done" })}
                      type="button"
                    >
                      {updatingActionIds.includes(action.id) ? "Guardando..." : "Marcar como hecha"}
                    </button>
                  ) : (
                    <span className="thread-chip closed">Hecha</span>
                  )}
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
