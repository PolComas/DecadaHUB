import { useState } from "react";
import { formatDateTime, statusLabel } from "../../../lib/formatters";
import { fetchMeetingAttendees } from "../../../lib/api";
import { CountChip, EmptyState, SkeletonBlock, durationMinutes } from "../../ui";
import type { Meeting, MeetingAttendee } from "../../../types";

const RESPONSE_COLORS: Record<string, string> = {
  accepted: "var(--risk-ok)",
  declined: "var(--risk-high)",
  tentative: "var(--risk-medium)",
  needsAction: "var(--text-tertiary)",
};

interface MeetingsTabProps {
  deletingMeetingId: string | null;
  meetings: Meeting[];
  isLoading: boolean;
  onDeleteMeeting: (meetingId: string, title: string) => void;
}

export default function MeetingsTab({
  deletingMeetingId,
  meetings,
  isLoading,
  onDeleteMeeting,
}: MeetingsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  async function toggleExpand(meetingId: string) {
    if (expandedId === meetingId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(meetingId);
    setAttendeesLoading(true);
    try {
      setAttendees(await fetchMeetingAttendees(meetingId));
    } catch {
      setAttendees([]);
    } finally {
      setAttendeesLoading(false);
    }
  }

  return (
    <>
      <div className="section-header">
        <h3>Reuniones recientes</h3>
        <CountChip>{meetings.length}</CountChip>
      </div>
      {isLoading ? (
        <div className="stack-list"><SkeletonBlock /><SkeletonBlock /></div>
      ) : meetings.length ? (
        <div className="stack-list">
          {meetings.map((meeting) => (
            <div className="list-card" key={meeting.id}>
              <strong>{meeting.title}</strong>
              <p>{meeting.description ?? "Sin descripción."}</p>
              <div className="list-footer meeting-footer">
                <span>{formatDateTime(meeting.start_at)}</span>
                <span>{durationMinutes(meeting.start_at, meeting.end_at)}</span>
                <span>{statusLabel(meeting.status)}</span>
                {meeting.attendee_count ? (
                  <button
                    className="ghost-button"
                    style={{ padding: "2px 8px", fontSize: 11 }}
                    onClick={() => void toggleExpand(meeting.id)}
                    type="button"
                  >
                    {meeting.attendee_count} asistentes {expandedId === meeting.id ? "▾" : "▸"}
                  </button>
                ) : null}
                <button
                  className="delete-btn"
                  disabled={deletingMeetingId === meeting.id}
                  onClick={() => onDeleteMeeting(meeting.id, meeting.title)}
                  title="Eliminar reunión"
                  type="button"
                >
                  {deletingMeetingId === meeting.id ? "Eliminando..." : "🗑 Eliminar"}
                </button>
              </div>
              {expandedId === meeting.id ? (
                <div className="attendee-list">
                  {attendeesLoading ? (
                    <span className="attendee-loading">Cargando...</span>
                  ) : attendees.length ? (
                    attendees.map((a) => (
                      <div className="attendee-row" key={a.id}>
                        <span className="attendee-name">
                          {a.full_name || a.email || "Desconocido"}
                          {a.is_organizer ? <span className="chip topic" style={{ marginLeft: 4 }}>Organizador</span> : null}
                        </span>
                        <span
                          className="attendee-status"
                          style={{ color: RESPONSE_COLORS[a.response_status ?? "needsAction"] ?? "var(--text-tertiary)" }}
                        >
                          {a.response_status ?? "Sin respuesta"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="attendee-loading">Sin datos de asistentes.</span>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No hay reuniones registradas." title="Sin reuniones" />
      )}
    </>
  );
}
