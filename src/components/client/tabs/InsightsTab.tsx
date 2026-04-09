import { CountChip, EmptyState, InsightCard, SkeletonBlock } from "../../ui";
import type { AiInsight } from "../../../types";

interface InsightsTabProps {
  insights: AiInsight[];
  isLoading: boolean;
}

export default function InsightsTab({ insights, isLoading }: InsightsTabProps) {
  return (
    <>
      <div className="section-header">
        <h3>Lectura cualitativa</h3>
        <CountChip>{insights.length}</CountChip>
      </div>
      {isLoading ? (
        <SkeletonBlock tall />
      ) : insights.length ? (
        <div className="stack-list">
          {insights.map((insight) => (
            <InsightCard insight={insight} key={insight.id} />
          ))}
        </div>
      ) : (
        <EmptyState message="Cuando la IA procese el contenido, aparecerá aquí." title="Sin análisis" />
      )}
    </>
  );
}
