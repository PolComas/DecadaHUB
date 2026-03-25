import type {
  ActionItem,
  AiInsight,
  ClientDetail,
  ClientKpi,
  ClientOverview,
  ClientRecord,
  DashboardOverview,
  DashboardSummary,
  DismissedClient,
  EmailMessage,
  EmailThread,
  Mailbox,
  Meeting,
  MergeCandidate,
  TeamMember,
  TimelineEvent,
  Transcript,
} from "../types";
import { getSupabaseClient } from "./supabase";

function normalizeArray<T>(value: T[] | null) {
  return value ?? [];
}

function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function buildSummary(clients: ClientOverview[]): DashboardSummary {
  const responseHours = clients
    .map((client) => client.avg_team_response_hours_30d)
    .filter((value) => value > 0);

  return {
    totalClients: clients.length,
    totalEmails30d: clients.reduce(
      (sum, client) => sum + client.emails_sent_30d + client.emails_received_30d,
      0,
    ),
    totalMeetings30d: clients.reduce((sum, client) => sum + client.meetings_30d, 0),
    averageTeamResponseHours: average(responseHours),
    highRiskClients: clients.filter((client) => client.risk_score_heuristic >= 6).length,
    openActions: clients.reduce((sum, client) => sum + client.open_actions, 0),
  };
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const supabase = getSupabaseClient();

  const [kpiResult, clientsResult, teamMembersResult, mailboxesResult] = await Promise.all([
    supabase
      .from("v_client_kpis_30d")
      .select("*")
      .order("risk_score_heuristic", { ascending: false })
      .returns<ClientKpi[]>(),
    supabase
      .from("clients")
      .select("id, name, slug, status, owner_team_member_id, primary_domain, notes, metadata, created_at, updated_at")
      .neq("status", "inactive")
      .order("name", { ascending: true })
      .returns<ClientRecord[]>(),
    supabase
      .from("team_members")
      .select("id, full_name, email, role, active")
      .eq("active", true)
      .returns<TeamMember[]>(),
    supabase
      .from("mailboxes")
      .select("id, team_member_id, label, email, provider, is_active")
      .eq("is_active", true)
      .order("label", { ascending: true })
      .returns<Mailbox[]>(),
  ]);

  if (kpiResult.error) throw kpiResult.error;
  if (clientsResult.error) throw clientsResult.error;
  if (teamMembersResult.error) throw teamMembersResult.error;
  if (mailboxesResult.error) throw mailboxesResult.error;

  const clients = normalizeArray(clientsResult.data);
  const clientKpis = normalizeArray(kpiResult.data);
  const teamMembers = normalizeArray(teamMembersResult.data);
  const mailboxes = normalizeArray(mailboxesResult.data);

  const ownerById = new Map(teamMembers.map((member) => [member.id, member.full_name]));
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  const mergedClients: ClientOverview[] = clientKpis
    .filter((kpi) => {
      // Only show clients that exist in the active clients list
      // (v_client_kpis_30d may include inactive clients)
      return clientMap.has(kpi.client_id);
    })
    .map((kpi) => {
      const client = clientMap.get(kpi.client_id)!;

      return {
        ...kpi,
        id: kpi.client_id,
        owner_name: client.owner_team_member_id
          ? ownerById.get(client.owner_team_member_id) ?? null
          : null,
        notes: client.notes ?? null,
        slug: client.slug ?? null,
        primary_domain: client.primary_domain ?? null,
      };
    });

  return {
    clients: mergedClients,
    mailboxes: mailboxes.map((mailbox) => ({
      ...mailbox,
      owner_name: mailbox.team_member_id
        ? ownerById.get(mailbox.team_member_id) ?? null
        : null,
    })),
    summary: buildSummary(mergedClients),
  };
}

export async function dismissClient(clientId: string, primaryDomain: string | null): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Mark client as inactive
  const { error: updateError } = await supabase
    .from("clients")
    .update({ status: "inactive" })
    .eq("id", clientId);

  if (updateError) throw updateError;

  // 2. Add domain to excluded_senders so it won't be auto-created again
  if (primaryDomain) {
    const { error: excludeError } = await supabase
      .from("excluded_senders")
      .upsert(
        { value: primaryDomain, reason: "dismissed" },
        { onConflict: "value" },
      );

    if (excludeError) throw excludeError;
  }
}

export async function fetchDismissedClients(): Promise<DismissedClient[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, primary_domain, updated_at")
    .eq("status", "inactive")
    .order("updated_at", { ascending: false })
    .returns<DismissedClient[]>();

  if (error) throw error;
  return data ?? [];
}

export async function restoreClient(clientId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Restore client status
  const { error: updateError } = await supabase
    .from("clients")
    .update({ status: "active" })
    .eq("id", clientId);

  if (updateError) throw updateError;

  // 2. Remove from excluded_senders if present
  const { data: client } = await supabase
    .from("clients")
    .select("primary_domain")
    .eq("id", clientId)
    .single();

  if (client?.primary_domain) {
    await supabase
      .from("excluded_senders")
      .delete()
      .eq("value", client.primary_domain);
  }
}

export async function fetchMergeCandidates(excludeId: string): Promise<MergeCandidate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, primary_domain")
    .neq("status", "inactive")
    .neq("id", excludeId)
    .order("name", { ascending: true })
    .returns<MergeCandidate[]>();

  if (error) throw error;
  return data ?? [];
}

export async function mergeClients(sourceId: string, targetId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Move all related data from source to target
  const tables = [
    { table: "email_messages", column: "client_id" },
    { table: "email_threads", column: "client_id" },
    { table: "meetings", column: "client_id" },
    { table: "transcripts", column: "client_id" },
    { table: "ai_insights", column: "client_id" },
    { table: "action_items", column: "client_id" },
  ];

  for (const { table, column } of tables) {
    const { error } = await supabase
      .from(table)
      .update({ [column]: targetId })
      .eq(column, sourceId);
    if (error) throw error;
  }

  // Move identifiers
  const { error: idError } = await supabase
    .from("client_identifiers")
    .update({ client_id: targetId })
    .eq("client_id", sourceId);
  if (idError) throw idError;

  // Mark source as inactive with merge metadata
  const { error: mergeError } = await supabase
    .from("clients")
    .update({
      status: "inactive" as const,
      notes: `Fusionat amb client target. ID original: ${sourceId}`,
      metadata: { merged_into: targetId, merged_at: new Date().toISOString() },
    })
    .eq("id", sourceId);
  if (mergeError) throw mergeError;
}

export async function fetchClientDetail(clientId: string): Promise<ClientDetail> {
  const supabase = getSupabaseClient();

  const [
    actionsResult,
    messagesResult,
    meetingsResult,
    threadsResult,
    insightsResult,
    transcriptsResult,
    timelineResult,
  ] = await Promise.all([
      supabase
        .from("action_items")
        .select("id, client_id, title, details, due_at, status, priority, meeting_id")
        .eq("client_id", clientId)
        .order("due_at", { ascending: true })
        .returns<ActionItem[]>(),
      supabase
        .from("email_messages")
        .select("id, client_id, thread_id, subject, snippet, sent_at, direction")
        .eq("client_id", clientId)
        .order("sent_at", { ascending: false })
        .limit(10)
        .returns<EmailMessage[]>(),
      supabase
        .from("meetings")
        .select("id, client_id, title, description, start_at, end_at, timezone, meeting_url, status")
        .eq("client_id", clientId)
        .order("start_at", { ascending: false })
        .limit(6)
        .returns<Meeting[]>(),
      supabase
        .from("email_threads")
        .select("id, client_id, subject, status, last_message_at, last_direction, message_count")
        .eq("client_id", clientId)
        .order("last_message_at", { ascending: false })
        .limit(8)
        .returns<EmailThread[]>(),
      supabase
        .from("ai_insights")
        .select("id, client_id, entity_type, summary, sentiment_label, sentiment_score, urgency_score, complaint_flag, satisfaction_flag, needs_follow_up, topics, risks, analyzed_at")
        .eq("client_id", clientId)
        .order("analyzed_at", { ascending: false })
        .limit(8)
        .returns<AiInsight[]>(),
      supabase
        .from("transcripts")
        .select("id, client_id, meeting_id, file_name, document_url, transcript_at, language_code, content_text")
        .eq("client_id", clientId)
        .order("transcript_at", { ascending: false })
        .limit(6)
        .returns<Transcript[]>(),
      supabase
        .from("v_client_activity_timeline")
        .select("*")
        .eq("client_id", clientId)
        .order("event_at", { ascending: false })
        .limit(24)
        .returns<TimelineEvent[]>(),
    ]);

  if (actionsResult.error) throw actionsResult.error;
  if (messagesResult.error) throw messagesResult.error;
  if (meetingsResult.error) throw meetingsResult.error;
  if (threadsResult.error) throw threadsResult.error;
  if (insightsResult.error) throw insightsResult.error;
  if (transcriptsResult.error) throw transcriptsResult.error;
  if (timelineResult.error) throw timelineResult.error;

  return {
    actions: normalizeArray(actionsResult.data),
    messages: normalizeArray(messagesResult.data),
    meetings: normalizeArray(meetingsResult.data),
    threads: normalizeArray(threadsResult.data),
    insights: normalizeArray(insightsResult.data).map((insight) => ({
      ...insight,
      topics: ensureArray(insight.topics),
      risks: ensureArray(insight.risks),
    })),
    transcripts: normalizeArray(transcriptsResult.data),
    timeline: normalizeArray(timelineResult.data),
  };
}
