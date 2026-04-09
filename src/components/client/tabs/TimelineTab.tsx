import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../Pagination";
import { CountChip, EmptyState, SkeletonTimeline, TimelineRow } from "../../ui";
import type { TimelineEvent } from "../../../types";

interface TimelineTabProps {
  timeline: TimelineEvent[];
  isLoading: boolean;
}

export default function TimelineTab({ timeline, isLoading }: TimelineTabProps) {
  const { slice, page, totalPages, hasNext, hasPrev, setPage } = usePagination(timeline, 8);

  return (
    <>
      <div className="section-header">
        <h3>Actividad reciente</h3>
        <CountChip>{timeline.length}</CountChip>
      </div>
      {isLoading ? <SkeletonTimeline /> : null}
      {!isLoading && !timeline.length ? (
        <EmptyState message="Cuando haya correos, reuniones o transcripciones, aparecerán aquí." title="Sin actividad" />
      ) : null}
      {!isLoading && timeline.length ? (
        <>
          <div className="timeline">
            {slice.map((event) => (
              <TimelineRow event={event} key={`${event.event_type}-${event.source_id}`} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
        </>
      ) : null}
    </>
  );
}
