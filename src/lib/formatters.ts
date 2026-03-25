import type {
  ActionPriority,
  ActionStatus,
  ClientStatus,
  MessageDirection,
  SentimentLabel,
  ThreadStatus,
} from "../types";

const datetimeFormatter = new Intl.DateTimeFormat("ca-ES", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("ca-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("ca-ES", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatHours(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return "0 h";
  }

  return `${new Intl.NumberFormat("ca-ES", {
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
    return "Sense data";
  }

  return datetimeFormatter.format(new Date(value));
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Sense data";
  }

  return dateFormatter.format(new Date(value));
}

export function statusLabel(status: ClientStatus | ThreadStatus | ActionStatus) {
  const labels: Record<string, string> = {
    active: "Actiu",
    paused: "En pausa",
    churn_risk: "Risc de churn",
    inactive: "Inactiu",
    open: "Obert",
    waiting_client: "Esperant client",
    waiting_team: "Esperant equip",
    closed: "Tancat",
    in_progress: "En curs",
    done: "Fet",
    cancelled: "Cancel·lat",
  };

  return labels[status] ?? status;
}

export function priorityLabel(priority: ActionPriority) {
  const labels: Record<ActionPriority, string> = {
    low: "Baixa",
    medium: "Mitjana",
    high: "Alta",
    critical: "Crítica",
  };

  return labels[priority];
}

export function directionLabel(direction: MessageDirection | null) {
  if (!direction) {
    return "Sense direcció";
  }

  const labels: Record<MessageDirection, string> = {
    team_to_client: "Equip -> client",
    client_to_team: "Client -> equip",
    internal: "Intern",
  };

  return labels[direction];
}

export function sentimentLabel(label: SentimentLabel) {
  const labels: Record<Exclude<SentimentLabel, null>, string> = {
    positive: "Positiu",
    neutral: "Neutre",
    negative: "Negatiu",
    mixed: "Mixt",
  };

  return label ? labels[label] : "Sense sentiment";
}

export function timelineLabel(type: string) {
  const labels: Record<string, string> = {
    email: "Email",
    meeting: "Reunió",
    transcript: "Transcript",
    action_item: "Acció",
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
