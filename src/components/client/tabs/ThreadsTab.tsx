import { formatDateTime, statusLabel } from "../../../lib/formatters";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import ThreadStatusBar from "../ThreadStatusBar";
import { CountChip, EmptyState, SkeletonBlock } from "../../ui";
import type { EmailThread } from "../../../types";

interface ThreadsTabProps {
  threads: EmailThread[];
  isLoading: boolean;
  onOpenThread: (threadId: string, subject: string) => void;
}

export default function ThreadsTab({ threads, isLoading, onOpenThread }: ThreadsTabProps) {
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
              <div
                className="list-card"
                key={thread.id}
                onClick={() => onOpenThread(thread.id, thread.subject ?? "Sin asunto")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenThread(thread.id, thread.subject ?? "Sin asunto"); } }}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
              >
                <div className="list-title-line">
                  <strong>{thread.subject ?? "Sin asunto"}</strong>
                  <span className={`thread-chip ${thread.status}`}>{statusLabel(thread.status)}</span>
                </div>
                <div className="list-footer">
                  <span>{thread.message_count} mensajes</span>
                  <span>{formatDateTime(thread.last_message_at)}</span>
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
