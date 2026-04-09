import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiskPill } from "../ui";
import type { ClientOverview, TeamMember } from "../../types";

interface ClientHeroProps {
  client: ClientOverview | null;
  isDismissing: boolean;
  isSavingNotes: boolean;
  isSavingOwner: boolean;
  onDismiss: () => void;
  onOpenMergeDialog: () => void;
  onSaveNotes: (notes: string) => Promise<void>;
  onSaveOwner: (ownerTeamMemberId: string | null) => Promise<void>;
  teamMembers: TeamMember[];
}

export default function ClientHero({
  client,
  isDismissing,
  isSavingNotes,
  isSavingOwner,
  onDismiss,
  onOpenMergeDialog,
  onSaveNotes,
  onSaveOwner,
  teamMembers,
}: ClientHeroProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(client?.notes ?? "");
  const [draftOwnerId, setDraftOwnerId] = useState(client?.owner_team_member_id ?? "");

  useEffect(() => {
    setDraftNotes(client?.notes ?? "");
    setDraftOwnerId(client?.owner_team_member_id ?? "");
  }, [client?.id, client?.notes, client?.owner_team_member_id]);

  const currentNotes = client?.notes ?? "";
  const defaultNotes =
    "Vista detallada de la cuenta con contexto operativo, cronología y seguimiento cualitativo.";
  const notesDirty = draftNotes.trim() !== currentNotes.trim();
  const ownerDirty = draftOwnerId !== (client?.owner_team_member_id ?? "");

  async function handleSaveNotes() {
    await onSaveNotes(draftNotes);
    setIsEditingNotes(false);
  }

  async function handleSaveOwner() {
    await onSaveOwner(draftOwnerId || null);
  }

  return (
    <section className="detail-hero">
      <div className="detail-hero-copy">
        <div className="detail-breadcrumbs">
          <Link className="topbar-link" to="/">Panel</Link>
          <span>/</span>
          <span>{client?.client_name ?? "Cliente"}</span>
        </div>
        <div className="detail-title-row">
          <div>
            <h2 className="detail-title">{client?.client_name ?? "Cargando..."}</h2>
          </div>
          {client ? <RiskPill score={client.risk_score_heuristic} /> : null}
        </div>
        <div className="hero-note-block">
          <div className="hero-note-header">
            <span className="detail-field-label">Notas</span>
            {!isEditingNotes ? (
              <button className="text-link" onClick={() => setIsEditingNotes(true)} type="button">
                Editar
              </button>
            ) : null}
          </div>

          {isEditingNotes ? (
            <>
              <textarea
                className="inline-textarea"
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                placeholder="Añade contexto para el equipo"
                rows={4}
              />
              <div className="detail-inline-actions">
                <button
                  className="ghost-button"
                  disabled={!notesDirty || isSavingNotes}
                  onClick={() => void handleSaveNotes()}
                  type="button"
                >
                  {isSavingNotes ? "Guardando..." : "Guardar nota"}
                </button>
                <button
                  className="ghost-button"
                  disabled={isSavingNotes}
                  onClick={() => {
                    setDraftNotes(currentNotes);
                    setIsEditingNotes(false);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <p className="hero-text">{currentNotes || defaultNotes}</p>
          )}
        </div>
      </div>
      <div className="detail-side-meta">
        <div className="detail-owner-block">
          <span className="detail-field-label">Responsable</span>
          <select
            className="detail-select"
            disabled={!client || isSavingOwner}
            value={draftOwnerId}
            onChange={(event) => setDraftOwnerId(event.target.value)}
          >
            <option value="">Sin responsable</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
          {ownerDirty ? (
            <div className="detail-inline-actions">
              <button
                className="ghost-button"
                disabled={isSavingOwner}
                onClick={() => void handleSaveOwner()}
                type="button"
              >
                {isSavingOwner ? "Guardando..." : "Guardar responsable"}
              </button>
              <button
                className="ghost-button"
                disabled={isSavingOwner}
                onClick={() => setDraftOwnerId(client?.owner_team_member_id ?? "")}
                type="button"
              >
                Cancelar
              </button>
            </div>
          ) : null}
        </div>
        <div className="session-chip muted">{client ? `${client.meetings_30d} reuniones / 30d` : "—"}</div>
        {client ? (
          <div className="detail-actions">
            <button className="ghost-button" onClick={onOpenMergeDialog} type="button">Fusionar</button>
            <button className="ghost-button danger" disabled={isDismissing} onClick={onDismiss} type="button">
              {isDismissing ? "Descartando..." : "Descartar"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
