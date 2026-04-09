import type {
  ActionItem,
  ActionPriority,
  ActionStatus,
  AiInsight,
  ClientDetail,
  ClientKpi,
  ClientOverview,
  ClientRecord,
  DashboardOverview,
  DashboardSummary,
  DismissedClient,
  EmailMessage,
  EmailMessageFull,
  EmailThread,
  Mailbox,
  Meeting,
  MeetingAttendee,
  MergeCandidate,
  MergedClient,
  TeamMember,
  TimelineEvent,
  Transcript,
  ThreadStatus,
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
        owner_team_member_id: client.owner_team_member_id ?? null,
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
    teamMembers,
    summary: buildSummary(mergedClients),
  };
}

export async function dismissClient(clientId: string, primaryDomain: string | null): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Dismiss any clients that were merged into this one
  const { data: mergedClients } = await supabase
    .from("clients")
    .select("id, primary_domain")
    .eq("status", "inactive")
    .filter("metadata->>merged_into", "eq", clientId);

  if (mergedClients?.length) {
    for (const mc of mergedClients) {
      // Clear merge metadata and keep as inactive (dismissed)
      await supabase
        .from("clients")
        .update({ metadata: {}, notes: null })
        .eq("id", mc.id);

      // Add their domain to excluded_senders too
      if (mc.primary_domain) {
        await supabase
          .from("excluded_senders")
          .upsert(
            { value: mc.primary_domain, reason: "dismissed" },
            { onConflict: "value" },
          );
      }
    }
  }

  // 2. Mark client as inactive
  const { error: updateError } = await supabase
    .from("clients")
    .update({ status: "inactive" })
    .eq("id", clientId);

  if (updateError) throw updateError;

  // 3. Add domain to excluded_senders so it won't be auto-created again
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
    .select("id, name, primary_domain, updated_at, metadata")
    .eq("status", "inactive")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  // Exclude merged clients — they show on the target client's page instead
  return (data ?? [])
    .filter((c) => !(c.metadata as Record<string, unknown>)?.merged_into)
    .map(({ metadata: _, ...rest }) => rest) as DismissedClient[];
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

export async function updateClientNotes(clientId: string, notes: string): Promise<void> {
  const supabase = getSupabaseClient();
  const normalizedNotes = notes.trim();

  const { error } = await supabase
    .from("clients")
    .update({ notes: normalizedNotes ? normalizedNotes : null })
    .eq("id", clientId);

  if (error) throw error;
}

export async function updateClientOwner(clientId: string, ownerTeamMemberId: string | null): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("clients")
    .update({ owner_team_member_id: ownerTeamMemberId })
    .eq("id", clientId);

  if (error) throw error;
}

export async function updateActionItem(
  actionId: string,
  updates: Partial<Pick<ActionItem, "status" | "priority">>,
): Promise<ActionItem> {
  const supabase = getSupabaseClient();

  const payload: Partial<Pick<ActionItem, "status" | "priority">> = {};

  if (updates.status) {
    payload.status = updates.status as ActionStatus;
  }

  if (updates.priority) {
    payload.priority = updates.priority as ActionPriority;
  }

  const { error } = await supabase
    .from("action_items")
    .update(payload)
    .eq("id", actionId);

  if (error) throw error;

  const { data: persisted, error: fetchError } = await supabase
    .from("action_items")
    .select("id, client_id, title, details, due_at, status, priority, meeting_id")
    .eq("id", actionId)
    .single();

  if (fetchError) throw fetchError;

  if (updates.status && persisted.status !== updates.status) {
    throw new Error("No se ha podido guardar el nuevo estado de la acción.");
  }

  if (updates.priority && persisted.priority !== updates.priority) {
    throw new Error("No se ha podido guardar la nueva prioridad de la acción.");
  }

  return persisted as ActionItem;
}

export async function deleteActionItem(actionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("action_items")
    .delete()
    .eq("id", actionId);

  if (error) throw error;
}

export async function updateThreadStatus(
  threadId: string,
  status: ThreadStatus,
): Promise<EmailThread> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("email_threads")
    .update({ status })
    .eq("id", threadId);

  if (error) throw error;

  const { data: persisted, error: fetchError } = await supabase
    .from("email_threads")
    .select("id, client_id, subject, status, last_message_at, last_direction, message_count")
    .eq("id", threadId)
    .single();

  if (fetchError) throw fetchError;
  if (persisted.status !== status) {
    throw new Error("No se ha podido guardar el nuevo estado del hilo.");
  }

  return persisted as EmailThread;
}

export async function deleteThread(threadId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("email_threads")
    .delete()
    .eq("id", threadId);

  if (error) throw error;
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

  // Mark source as inactive with merge metadata (store sourceId for unmerge)
  const { error: mergeError } = await supabase
    .from("clients")
    .update({
      status: "inactive" as const,
      notes: `Fusionado con cliente de destino. ID original: ${sourceId}`,
      metadata: {
        merged_into: targetId,
        merged_at: new Date().toISOString(),
        original_client_id: sourceId,
      },
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
    mergedClientsResult,
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
        .limit(50)
        .returns<EmailMessage[]>(),
      supabase
        .from("meetings")
        .select("id, client_id, title, description, start_at, end_at, timezone, meeting_url, status, attendee_count")
        .eq("client_id", clientId)
        .order("start_at", { ascending: false })
        .limit(6)
        .returns<Meeting[]>(),
      supabase
        .from("email_threads")
        .select("id, client_id, subject, status, last_message_at, last_direction, message_count")
        .eq("client_id", clientId)
        .order("last_message_at", { ascending: false })
        .limit(20)
        .returns<EmailThread[]>(),
      supabase
        .from("ai_insights")
        .select("id, client_id, entity_type, summary, sentiment_label, sentiment_score, urgency_score, complaint_flag, satisfaction_flag, needs_follow_up, topics, risks, action_suggestions, analyzed_at")
        .eq("client_id", clientId)
        .order("analyzed_at", { ascending: false })
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
      supabase
        .from("clients")
        .select("id, name, primary_domain, metadata")
        .eq("status", "inactive")
        .filter("metadata->>merged_into", "eq", clientId)
        .returns<Array<{ id: string; name: string; primary_domain: string | null; metadata: Record<string, unknown> }>>(),
    ]);

  if (actionsResult.error) throw actionsResult.error;
  if (messagesResult.error) throw messagesResult.error;
  if (meetingsResult.error) throw meetingsResult.error;
  if (threadsResult.error) throw threadsResult.error;
  if (insightsResult.error) throw insightsResult.error;
  if (transcriptsResult.error) throw transcriptsResult.error;
  if (timelineResult.error) throw timelineResult.error;
  if (mergedClientsResult.error) throw mergedClientsResult.error;

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
    mergedClients: normalizeArray(mergedClientsResult.data).map((c) => ({
      id: c.id,
      name: c.name,
      primary_domain: c.primary_domain,
      merged_at: typeof c.metadata?.merged_at === "string" ? c.metadata.merged_at : null,
    })),
  };
}

export async function deleteEmail(messageId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: partError } = await supabase
    .from("email_message_participants")
    .delete()
    .eq("message_id", messageId);
  if (partError) throw partError;

  const { error: msgError } = await supabase
    .from("email_messages")
    .delete()
    .eq("id", messageId);
  if (msgError) throw msgError;
}

export async function deleteInsight(insightId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("ai_insights")
    .delete()
    .eq("id", insightId);

  if (error) throw error;
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId);

  if (error) throw error;
}

export async function deleteTranscript(transcriptId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("transcripts")
    .delete()
    .eq("id", transcriptId);

  if (error) throw error;
}

export async function fetchEmailFull(messageId: string): Promise<EmailMessageFull> {
  const supabase = getSupabaseClient();

  const [msgResult, senderResult] = await Promise.all([
    supabase
      .from("email_messages")
      .select("id, client_id, thread_id, subject, snippet, body_text, sent_at, direction")
      .eq("id", messageId)
      .single(),
    supabase
      .from("email_message_participants")
      .select("email")
      .eq("message_id", messageId)
      .eq("participant_role", "from")
      .limit(1),
  ]);

  if (msgResult.error) throw msgResult.error;

  return {
    ...(msgResult.data as EmailMessageFull),
    sender_email: senderResult.data?.[0]?.email ?? null,
  };
}

export async function fetchMeetingAttendees(meetingId: string): Promise<MeetingAttendee[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("meeting_attendees")
    .select("id, meeting_id, email, full_name, response_status, is_organizer")
    .eq("meeting_id", meetingId)
    .order("is_organizer", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchThreadMessages(threadId: string): Promise<EmailMessageFull[]> {
  const supabase = getSupabaseClient();

  const { data: messages, error } = await supabase
    .from("email_messages")
    .select("id, client_id, thread_id, subject, snippet, body_text, sent_at, direction")
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: true });
  if (error) throw error;
  if (!messages?.length) return [];

  // Fetch senders for all messages in batch
  const ids = messages.map((m) => m.id);
  const { data: participants } = await supabase
    .from("email_message_participants")
    .select("message_id, email")
    .in("message_id", ids)
    .eq("participant_role", "from");

  const senderMap = new Map((participants ?? []).map((p) => [p.message_id, p.email]));

  return messages.map((m) => ({
    ...(m as EmailMessageFull),
    sender_email: senderMap.get(m.id) ?? null,
  }));
}

export async function unmergeClient(sourceId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Read merge metadata to find target
  const { data: source, error: readError } = await supabase
    .from("clients")
    .select("metadata")
    .eq("id", sourceId)
    .single();
  if (readError) throw readError;

  const targetId = (source?.metadata as Record<string, unknown>)?.merged_into as string | undefined;
  if (!targetId) throw new Error("Este cliente no está fusionado.");

  // 2. Find which identifiers belong to the source client
  // (they were moved to target during merge)
  // We need to identify records that belong to source by domain/email
  const { data: sourceRecord } = await supabase
    .from("clients")
    .select("primary_domain, name")
    .eq("id", sourceId)
    .single();

  // 3. Move identifiers back: find identifiers that match the source's domain
  if (sourceRecord?.primary_domain) {
    await supabase
      .from("client_identifiers")
      .update({ client_id: sourceId })
      .eq("client_id", targetId)
      .eq("identifier_value", sourceRecord.primary_domain);
  }

  // 4. Move data back: use the identifiers to find emails from source's domain
  // For emails: find messages where participants match source domain
  // Simpler approach: move all records that were originally from the source
  // We identify them through email_message_participants matching the source domain
  if (sourceRecord?.primary_domain) {
    const domain = sourceRecord.primary_domain;

    // Find message IDs from the source domain
    const { data: participantRows } = await supabase
      .from("email_message_participants")
      .select("message_id, email")
      .eq("participant_role", "from")
      .ilike("email", `%@${domain}`);

    if (participantRows?.length) {
      const messageIds = [...new Set(participantRows.map((p) => p.message_id))];

      // Get thread IDs for those messages
      const { data: msgRows } = await supabase
        .from("email_messages")
        .select("id, thread_id")
        .in("id", messageIds)
        .eq("client_id", targetId);

      if (msgRows?.length) {
        const threadIds = [...new Set(msgRows.map((m) => m.thread_id))];

        // Move messages back to source
        await supabase
          .from("email_messages")
          .update({ client_id: sourceId })
          .in("id", msgRows.map((m) => m.id));

        // Move threads back to source
        await supabase
          .from("email_threads")
          .update({ client_id: sourceId })
          .in("id", threadIds)
          .eq("client_id", targetId);
      }
    }

    // Move meetings where attendees match source domain
    const { data: meetingAttendees } = await supabase
      .from("meeting_attendees")
      .select("meeting_id, email")
      .ilike("email", `%@${domain}`);

    if (meetingAttendees?.length) {
      const meetingIds = [...new Set(meetingAttendees.map((a) => a.meeting_id))];
      await supabase
        .from("meetings")
        .update({ client_id: sourceId })
        .in("id", meetingIds)
        .eq("client_id", targetId);
    }

    // Move transcripts linked to those meetings
    const { data: meetingsOfSource } = await supabase
      .from("meetings")
      .select("id")
      .eq("client_id", sourceId);

    if (meetingsOfSource?.length) {
      const meetingIdsForTranscripts = meetingsOfSource.map((m) => m.id);
      await supabase
        .from("transcripts")
        .update({ client_id: sourceId })
        .in("meeting_id", meetingIdsForTranscripts)
        .eq("client_id", targetId);
    }

    // Move ai_insights for moved entities
    const { data: sourceMessages } = await supabase
      .from("email_messages")
      .select("id")
      .eq("client_id", sourceId);

    if (sourceMessages?.length) {
      await supabase
        .from("ai_insights")
        .update({ client_id: sourceId })
        .eq("client_id", targetId)
        .eq("entity_type", "email_message")
        .in("entity_id", sourceMessages.map((m) => m.id));
    }

    // Move action_items linked to source entities
    await supabase
      .from("action_items")
      .update({ client_id: sourceId })
      .eq("client_id", targetId)
      .not("source_entity_id", "is", null);
    // Note: only action_items that reference moved entities should go back,
    // but we can't easily distinguish them. For now, keep them on target.
  }

  // 5. Restore source client to active
  const { error: restoreError } = await supabase
    .from("clients")
    .update({
      status: "active" as const,
      notes: null,
      metadata: {},
    })
    .eq("id", sourceId);
  if (restoreError) throw restoreError;
}

export async function fetchOrphanTranscripts(): Promise<Transcript[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transcripts")
    .select("id, client_id, meeting_id, file_name, document_url, transcript_at, language_code, content_text")
    .is("client_id", null)
    .order("transcript_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function assignTranscriptToClient(transcriptId: string, clientId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: txError } = await supabase
    .from("transcripts")
    .update({ client_id: clientId })
    .eq("id", transcriptId);
  if (txError) throw txError;

  await supabase
    .from("ai_insights")
    .update({ client_id: clientId })
    .eq("entity_type", "transcript")
    .eq("entity_id", transcriptId);

  await supabase
    .from("action_items")
    .update({ client_id: clientId })
    .eq("source_entity_type", "transcript")
    .eq("source_entity_id", transcriptId);
}
