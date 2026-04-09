import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import { CountChip, EmptyState, InsightCard, SkeletonBlock } from "../../ui";
import type { AiInsight } from "../../../types";

interface InsightsTabProps {
  insights: AiInsight[];
  isLoading: boolean;
  deletingInsightId: string | null;
  onDeleteInsight: (id: string, summary: string) => void;
}

export default function InsightsTab({
  insights,
  isLoading,
  deletingInsightId,
  onDeleteInsight,
}: InsightsTabProps) {
  const { slice, page, totalPages, hasNext, hasPrev, setPage } = usePagination(insights, 8);

  return (
    <>
      <div className="section-header">
        <h3>Lectura cualitativa</h3>
        <CountChip>{insights.length}</CountChip>
      </div>
      {isLoading ? (
        <SkeletonBlock tall />
      ) : insights.length ? (
        <>
          <div className="stack-list">
            {slice.map((insight) => (
              <InsightCard
                footerAction={(
                  <button
                    className="delete-btn"
                    disabled={deletingInsightId === insight.id}
                    onClick={() => onDeleteInsight(insight.id, insight.summary ?? "Sin resumen")}
                    title="Eliminar análisis"
                    type="button"
                  >
                    {deletingInsightId === insight.id ? "Eliminando..." : "🗑 Eliminar"}
                  </button>
                )}
                insight={insight}
                key={insight.id}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState message="Cuando la IA procese el contenido, aparecerá aquí." title="Sin análisis" />
      )}
    </>
  );
}
