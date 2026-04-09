export type ClientStatus = "active" | "paused" | "churn_risk" | "inactive";
export type ThreadStatus = "open" | "waiting_client" | "waiting_team" | "closed";
export type MessageDirection = "team_to_client" | "client_to_team" | "internal";
export type ActionStatus = "open" | "in_progress" | "done" | "cancelled";
export type ActionPriority = "low" | "medium" | "high" | "critical";
export type SentimentLabel = "positive" | "neutral" | "negative" | "mixed" | null;

export interface ClientKpi {
  client_id: string;
  client_name: string;
  client_status: ClientStatus;
  emails_sent_30d: number;
  emails_received_30d: number;
  avg_client_response_hours_30d: number;
  avg_team_response_hours_30d: number;
  avg_client_response_natural_hours_30d: number;
  avg_team_response_natural_hours_30d: number;
  stalled_threads_gt_72h: number;
  meetings_30d: number;
  avg_meeting_minutes_30d: number;
  negative_signals_30d: number;
  positive_signals_30d: number;
  open_actions: number;
  overdue_actions: number;
  risk_score_heuristic: number;
}

export interface ClientRecord {
  id: string;
  name: string;
  slug: string | null;
  status: ClientStatus;
  owner_team_member_id: string | null;
  primary_domain: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string | null;
  active: boolean;
}

export interface Mailbox {
  id: string;
  team_member_id: string | null;
  label: string;
  email: string;
  provider: string;
  is_active: boolean;
}

export interface ActionItem {
  id: string;
  client_id: string | null;
  title: string;
  details: string | null;
  due_at: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  meeting_id: string | null;
}

export interface EmailMessage {
  id: string;
  client_id: string | null;
  thread_id: string;
  subject: string | null;
  snippet: string | null;
  sent_at: string;
  direction: MessageDirection;
}

export interface EmailMessageFull extends EmailMessage {
  body_text: string | null;
  sender_email?: string | null;
}

export interface MergedClient {
  id: string;
  name: string;
  primary_domain: string | null;
  merged_at: string | null;
}

export interface Meeting {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string | null;
  meeting_url: string | null;
  status: string;
  attendee_count: number | null;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  email: string | null;
  full_name: string | null;
  response_status: string | null;
  is_organizer: boolean;
}

export interface EmailThread {
  id: string;
  client_id: string | null;
  subject: string | null;
  status: ThreadStatus;
  last_message_at: string | null;
  last_direction: MessageDirection | null;
  message_count: number;
}

export interface AiInsight {
  id: string;
  client_id: string | null;
  entity_type: string;
  summary: string | null;
  sentiment_label: SentimentLabel;
  sentiment_score: number | null;
  urgency_score: number | null;
  complaint_flag: boolean;
  satisfaction_flag: boolean;
  needs_follow_up: boolean;
  topics: unknown;
  risks: unknown;
  action_suggestions: unknown;
  analyzed_at: string;
}

export interface Transcript {
  id: string;
  client_id: string | null;
  meeting_id: string | null;
  file_name: string | null;
  document_url: string | null;
  transcript_at: string | null;
  language_code: string | null;
  content_text: string;
}

export interface TimelineEvent {
  client_id: string;
  event_at: string;
  event_type: "email" | "meeting" | "transcript" | "action_item";
  source_id: string;
  title: string;
  preview: string;
  metadata: Record<string, unknown> | null;
}

export interface ClientOverview extends ClientKpi {
  id: string;
  owner_name: string | null;
  notes: string | null;
  slug: string | null;
  primary_domain: string | null;
}

export interface DashboardSummary {
  totalClients: number;
  totalEmails30d: number;
  totalMeetings30d: number;
  averageTeamResponseHours: number;
  highRiskClients: number;
  openActions: number;
}

export interface DashboardOverview {
  clients: ClientOverview[];
  mailboxes: Array<Mailbox & { owner_name: string | null }>;
  summary: DashboardSummary;
}

export interface ClientDetail {
  actions: ActionItem[];
  messages: EmailMessage[];
  meetings: Meeting[];
  threads: EmailThread[];
  insights: AiInsight[];
  transcripts: Transcript[];
  timeline: TimelineEvent[];
  mergedClients: MergedClient[];
}

export interface DismissedClient {
  id: string;
  name: string;
  primary_domain: string | null;
  updated_at: string;
}

export interface MergeCandidate {
  id: string;
  name: string;
  primary_domain: string | null;
}
