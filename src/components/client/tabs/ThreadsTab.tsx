import { formatDateTime, statusLabel } from "../../../lib/formatters";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import ThreadStatusBar from "../ThreadStatusBar";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { EmailThread, ThreadStatus } from "../../../types";

interface ThreadsTabProps {
  deletingThreadId: string | null;
  threads: EmailThread[];
  isLoading: boolean;
  updatingThreadIds: string[];
  onDeleteThread: (threadId: string, subject: string) => void;
  onOpenThread: (threadId: string, subject: string) => void;
  onUpdateThreadStatus: (threadId: string, status: ThreadStatus) => Promise<void>;
}

const THREAD_STATUS_OPTIONS: ThreadStatus[] = ["open", "waiting_team", "waiting_client", "closed"];

export default function ThreadsTab({
  deletingThreadId,
  threads,
  isLoading,
  updatingThreadIds,
  onDeleteThread,
  onOpenThread,
  onUpdateThreadStatus,
}: ThreadsTabProps) {
  const { slice, page, totalPages, hasNext, hasPrev, setPage } = usePagination(threads, 10);

  return (
    <>
      <div className="section-header">
        <h3>Hilos de correo</h3>
        <CountChip>{threads.length}</CountChip>
      </div>
      {isLoading ? (
        <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
      ) : threads.length ? (
        <>
          <ThreadStatusBar threads={threads} />
          <div className="stack-list">
            {slice.map((thread) => (
              <div className="list-card-wrapper" key={thread.id}>
                <div
                  className={`list-card thread-card ${thread.status}`}
                  onClick={() => onOpenThread(thread.id, thread.subject ?? "Sin asunto")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenThread(thread.id, thread.subject ?? "Sin asunto"); } }}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="list-title-line">
                    <strong>{thread.subject ?? "Sin asunto"}</strong>
                    <select
                      className={`thread-status-select ${thread.status}`}
                      disabled={updatingThreadIds.includes(thread.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        void onUpdateThreadStatus(thread.id, event.target.value as ThreadStatus)
                      }
                      onKeyDown={(event) => event.stopPropagation()}
                      value={thread.status}
                    >
                      {THREAD_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="list-footer thread-footer">
                    <span>{thread.message_count} mensajes</span>
                    <span>{formatDateTime(thread.last_message_at)}</span>
                    <button
                      className="delete-btn"
                      disabled={deletingThreadId === thread.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteThread(thread.id, thread.subject ?? "Sin asunto");
                      }}
                      title="Eliminar hilo"
                      type="button"
                    >
                      {deletingThreadId === thread.id ? "Eliminando..." : "🗑 Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState message="No hay hilos disponibles." title="Sin hilos" />
      )}
    </>
  );
}
