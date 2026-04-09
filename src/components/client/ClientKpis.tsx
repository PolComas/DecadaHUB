import { useMemo } from "react";
import { formatHours } from "../../lib/formatters";
import { ActivityCallout, FocusMetric } from "../ui";
import type { ClientOverview } from "../../types";

interface ClientKpisProps {
  client: ClientOverview | null;
}

export default function ClientKpis({ client }: ClientKpisProps) {
  const attentionCallout = useMemo(() => {
    if (!client) return null;
    if (client.overdue_actions > 0) {
      return { title: "Acciones vencidas", body: `${client.overdue_actions} acciones fuera de plazo que pueden impactar en la percepción del cliente.`, tone: "warning" as const };
    }
    if (client.stalled_threads_gt_72h > 0) {
      return { title: "Hilos estancados", body: `${client.stalled_threads_gt_72h} hilos llevan más de 72 h sin avanzar.`, tone: "warning" as const };
    }
    if (client.negative_signals_30d > 0) {
      return { title: "Señales a seguir", body: `Se han detectado ${client.negative_signals_30d} señales negativas en los últimos 30 días.`, tone: "default" as const };
    }
    return { title: "Relación estable", body: "No hay indicadores fuertes de riesgo inmediato.", tone: "default" as const };
  }, [client]);

  return (
    <>
      <section className="stats-grid detail-stats">
        <FocusMetric helper="Media en horas laborables" label="Respuesta equipo" value={client ? formatHours(client.avg_team_response_hours_30d) : "—"} />
        <FocusMetric helper="Tiempo hasta cualquier respuesta" label="Respuesta cliente" value={client ? formatHours(client.avg_client_response_hours_30d) : "—"} />
        <FocusMetric helper="Conversación bloqueada >72 h" label="Hilos estancados" value={client ? String(client.stalled_threads_gt_72h) : "—"} />
        <FocusMetric helper="IA últimos 30 días" label="Señales negativas" value={client ? String(client.negative_signals_30d) : "—"} />
      </section>

      <section className="two-up two-up-wide">
        {attentionCallout ? <ActivityCallout body={attentionCallout.body} title={attentionCallout.title} tone={attentionCallout.tone} /> : null}
        <ActivityCallout
          body={client ? `${client.emails_sent_30d} enviados, ${client.emails_received_30d} recibidos, ${client.open_actions} acciones abiertas.` : "Sin contexto."}
          title="Resumen rápido"
        />
      </section>
    </>
  );
}
