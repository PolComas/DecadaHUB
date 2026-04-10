import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Info } from "lucide-react";
import {
  directionLabel,
  formatDate,
  formatDateTime,
  formatHours,
  formatMinutes,
  priorityLabel,
  riskTone,
  sentimentLabel,
  statusLabel,
  timelineLabel,
} from "../lib/formatters";
import type {
  AiInsight,
  ClientOverview,
  EmailMessage,
  TimelineEvent,
} from "../types";

export function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string;
  note: string;
  icon?: LucideIcon;
  iconColor?: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-card-main">
        <div className="metric-card-copy">
          <div className="metric-card-label-row">
            {Icon ? (
              <div
                className="metric-card-icon"
                style={{ background: `${iconColor}1a`, color: iconColor }}
              >
                <Icon size={14} />
              </div>
            ) : null}
            <span className="metric-card-label">{label}</span>
          </div>
          <p className="metric-card-note">{note}</p>
        </div>
        <strong className="metric-card-value">{value}</strong>
      </div>
    </article>
  );
}

export function RiskPill({ score }: { score: number }) {
  const tone = riskTone(score);
  const label =
    tone === "critical" ? "Riesgo alto" : tone === "warning" ? "Riesgo medio" : "OK";

  return <span className={`risk-pill ${tone}`}>{label}</span>;
}

export function FocusMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="focus-metric">
      <div className="focus-metric-main">
        <div className="focus-metric-copy">
          <span>{label}</span>
          {helper ? <p>{helper}</p> : null}
        </div>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-card">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export function SkeletonBlock({ tall = false }: { tall?: boolean }) {
  return <div className={`skeleton-block ${tall ? "tall" : ""}`} />;
}

export function SkeletonTimeline() {
  return (
    <div className="timeline">
      <SkeletonBlock />
      <SkeletonBlock />
      <SkeletonBlock />
    </div>
  );
}

export function CountChip({ children }: { children: ReactNode }) {
  return <span className="count-chip">{children}</span>;
}

export function TimelineRow({ event }: { event: TimelineEvent }) {
  return (
    <article className="timeline-row">
      <div className={`timeline-dot ${event.event_type}`} />
      <div className="timeline-body">
        <div className="timeline-headline">
          <strong>{event.title}</strong>
          <span>{timelineLabel(event.event_type)}</span>
        </div>
        <p>{event.preview || "Sin resumen disponible."}</p>
        <div className="timeline-meta">
          <span>{formatDateTime(event.event_at)}</span>
        </div>
      </div>
    </article>
  );
}

function insightEntityLabel(entityType: string) {
  const labels: Record<string, string> = {
    email_message: "Correo",
    meeting: "Reunión",
    transcript: "Transcripción",
    action_item: "Acción",
  };

  return labels[entityType] ?? entityType.replaceAll("_", " ");
}

function insightSentimentClass(label: AiInsight["sentiment_label"]) {
  if (label === "positive") return "positive";
  if (label === "negative") return "negative";
  if (label === "mixed") return "mixed";
  return "neutral";
}

export function InsightCard({
  insight,
  footerAction,
}: {
  insight: AiInsight;
  footerAction?: ReactNode;
}) {
  const topics = Array.isArray(insight.topics) ? insight.topics : [];
  const risks = Array.isArray(insight.risks) ? insight.risks : [];
  const suggestions = Array.isArray(insight.action_suggestions) ? insight.action_suggestions : [];
  const hasChips =
    insight.complaint_flag ||
    insight.satisfaction_flag ||
    insight.needs_follow_up ||
    topics.length > 0 ||
    risks.length > 0;

  return (
    <article className={`insight-card ${insight.sentiment_label ?? "neutral"}`}>
      <div className="insight-head">
        <div className="insight-copy">
          <h4>{insight.summary ?? "Sin resumen generado"}</h4>

          {hasChips ? (
            <div className="chip-row insight-chip-row">
              {insight.complaint_flag ? <span className="chip complaint">Queja</span> : null}
              {insight.satisfaction_flag ? <span className="chip satisfaction">Satisfacción</span> : null}
              {insight.needs_follow_up ? <span className="chip follow-up">Seguimiento</span> : null}
              {topics.map((topic) => (
                <span className="chip topic" key={String(topic)}>
                  {String(topic)}
                </span>
              ))}
              {risks.map((risk) => (
                <span className="chip risk" key={String(risk)}>
                  {String(risk)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="insight-side">
          <div className="insight-meta-row">
            <span className="insight-meta">
              {insightEntityLabel(insight.entity_type)} · {formatDateTime(insight.analyzed_at)}
            </span>
            {footerAction}
          </div>

          <div className="insight-scores">
            <span className={`insight-sentiment ${insightSentimentClass(insight.sentiment_label)}`}>
              {sentimentLabel(insight.sentiment_label)}
            </span>
            <ScoreBar label="Urgencia" value={insight.urgency_score} mode="urgency" />
            <ScoreBar label="Tono" value={insight.sentiment_score} mode="sentiment" />
          </div>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <ul className="insight-suggestions">
          {suggestions.map((s, i) => (
            <li key={i}>{typeof s === "object" && s !== null && "text" in s ? String((s as { text: string }).text) : String(s)}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function ScoreBar({ label, value, mode }: { label: string; value: number | null; mode: "sentiment" | "urgency" }) {
  if (value === null || Number.isNaN(value)) {
    return <span>{label} —</span>;
  }

  const clamped = Math.max(0, Math.min(1, value));
  let color: string;
  if (mode === "urgency") {
    color = clamped > 0.66 ? "var(--risk-high)" : clamped > 0.33 ? "var(--risk-medium)" : "var(--risk-ok)";
  } else {
    color = clamped > 0.66 ? "var(--risk-ok)" : clamped > 0.33 ? "var(--risk-medium)" : "var(--risk-high)";
  }

  return (
    <span className="score-bar-wrapper" title={`${label}: ${clamped.toFixed(2)}`}>
      <span className="score-bar-label">{label}</span>
      <span className="score-bar">
        <span className="score-bar-fill" style={{ width: `${clamped * 100}%`, background: color }} />
      </span>
    </span>
  );
}

export function RecentMessageCard({ message }: { message: EmailMessage }) {
  return (
    <div className="list-card">
      <div className="list-title-line">
        <strong>{message.subject ?? "Sin asunto"}</strong>
        <span
          className={`thread-chip ${message.direction === "client_to_team" ? "client_to_team" : "team_to_client"}`}
        >
          {directionLabel(message.direction)}
        </span>
      </div>
      <p>{message.snippet ?? "Sin fragmento disponible."}</p>
      <div className="list-footer">
        <span>{formatDateTime(message.sent_at)}</span>
      </div>
    </div>
  );
}

export function ClientListRow({ client }: { client: ClientOverview }) {
  return (
    <Link className="portfolio-row" to={`/clients/${client.id}`}>
      <div className="portfolio-cell portfolio-primary">
        <div className={`item-avatar ${avatarTone(client.client_name)}`}>
          {initials(client.client_name)}
        </div>
        <div>
          <strong>{client.client_name}</strong>
          <p>{client.owner_name ?? "Sin responsable"}</p>
        </div>
      </div>
      <div className="portfolio-cell">
        <RiskPill score={client.risk_score_heuristic} />
      </div>
      <div className="portfolio-cell">{formatHours(client.avg_team_response_hours_30d)}</div>
      <div className="portfolio-cell">{client.stalled_threads_gt_72h}</div>
      <div className="portfolio-cell">{client.open_actions}</div>
      <div className="portfolio-cell">{client.negative_signals_30d}</div>
    </Link>
  );
}

export function ActivityCallout({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone?: "default" | "warning";
}) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div className={`activity-callout ${tone === "warning" ? "warning" : ""}`}>
      <div className="callout-head">
        <Icon className="callout-icon" size={13} />
        <strong>{title}</strong>
      </div>
      <p>{body}</p>
    </div>
  );
}

export function ActionSummary({
  dueAt,
  status,
  priority,
}: {
  dueAt: string | null;
  status: string;
  priority: string;
}) {
  return (
    <div className="list-footer">
      <span>{priorityLabel(priority as never)}</span>
      <span>{statusLabel(status as never)}</span>
      <span>{formatDate(dueAt)}</span>
    </div>
  );
}

function formatScore(score: number | null) {
  if (score === null || Number.isNaN(score)) {
    return "—";
  }

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(score);
}

export function durationMinutes(startAt: string, endAt: string) {
  return formatMinutes((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
}

export function initials(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarTone(seed: string) {
  const tones = ["tone-indigo", "tone-emerald", "tone-slate"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tones[Math.abs(hash) % tones.length];
}
