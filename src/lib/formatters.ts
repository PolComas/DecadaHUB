import type {
  ActionPriority,
  ActionStatus,
  ClientStatus,
  MessageDirection,
  SentimentLabel,
  ThreadStatus,
} from "../types";

const datetimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatHours(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return "0 h";
  }

  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)} h`;
}

export function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return "0 min";
  }

  return `${Math.round(value)} min`;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return datetimeFormatter.format(new Date(value));
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return dateFormatter.format(new Date(value));
}

export function statusLabel(status: ClientStatus | ThreadStatus | ActionStatus | string | null) {
  if (!status) {
    return "Sin estado";
  }

  const labels: Record<string, string> = {
    active: "Activo",
    paused: "En pausa",
    churn_risk: "Riesgo de baja",
    inactive: "Inactivo",
    open: "Abierto",
    waiting_client: "Esperando al cliente",
    waiting_team: "Esperando al equipo",
    closed: "Cerrado",
    in_progress: "En curso",
    done: "Hecho",
    cancelled: "Cancelado",
    confirmed: "Confirmado",
    tentative: "Tentativo",
    cancelled_meeting: "Cancelado",
  };

  return labels[status] ?? status;
}

export function priorityLabel(priority: ActionPriority) {
  const labels: Record<ActionPriority, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    critical: "Crítica",
  };

  return labels[priority];
}

export function directionLabel(direction: MessageDirection | null) {
  if (!direction) {
    return "Sin dirección";
  }

  const labels: Record<MessageDirection, string> = {
    team_to_client: "Equipo -> cliente",
    client_to_team: "Cliente -> equipo",
    internal: "Interno",
  };

  return labels[direction];
}

export function sentimentLabel(label: SentimentLabel) {
  const labels: Record<Exclude<SentimentLabel, null>, string> = {
    positive: "Positivo",
    neutral: "Neutral",
    negative: "Negativo",
    mixed: "Mixto",
  };

  return label ? labels[label] : "Sin sentimiento";
}

export function timelineLabel(type: string) {
  const labels: Record<string, string> = {
    email: "Correo",
    meeting: "Reunión",
    transcript: "Transcripción",
    action_item: "Acción",
  };

  return labels[type] ?? type;
}

export function riskTone(score: number) {
  if (score >= 8) {
    return "critical";
  }

  if (score >= 4) {
    return "warning";
  }

  return "healthy";
}
