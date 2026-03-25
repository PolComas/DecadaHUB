Query:
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

Output:
[
  {
    "table_name": "action_items",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "client_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "source_entity_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "source_entity_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "meeting_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "owner_team_member_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "details",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "due_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'open'::action_status",
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "priority",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'medium'::action_priority",
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "action_items",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "entity_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "entity_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "client_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "model_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "prompt_version",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "sentiment_label",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "sentiment_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "urgency_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "complaint_flag",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "satisfaction_flag",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "needs_follow_up",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "summary",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "topics",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'[]'::jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "risks",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'[]'::jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "action_suggestions",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'[]'::jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "raw_output",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'{}'::jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "analyzed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "ai_insights",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "business_holidays",
    "column_name": "holiday_date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "business_holidays",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "business_holidays",
    "column_name": "region",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'default'::text",
    "character_maximum_length": null
  },
  {
    "table_name": "business_holidays",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "business_rules",
    "column_name": "id",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "1",
    "character_maximum_length": null
  },
  {
    "table_name": "business_rules",
    "column_name": "timezone",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'Europe/Madrid'::text",
    "character_maximum_length": null
  },
  {
    "table_name": "business_rules",
    "column_name": "workday_start",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": "'09:00:00'::time without time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "business_rules",
    "column_name": "workday_end",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": "'19:00:00'::time without time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "business_rules",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "business_rules",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "client_identifiers",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "client_identifiers",
    "column_name": "client_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "client_identifiers",
    "column_name": "identifier_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "client_identifiers",
    "column_name": "identifier_value",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "client_identifiers",
    "column_name": "confidence",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "1.00",
    "character_maximum_length": null
  },
  {
    "table_name": "client_identifiers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "slug",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'active'::client_status",
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "owner_team_member_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "primary_domain",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "metadata",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'{}'::jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "clients",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "client_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "full_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "email",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "company_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "contact_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'client'::contact_type",
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "metadata",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'{}'::jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "contacts",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "email_message_participants",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "email_message_participants",
    "column_name": "message_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_message_participants",
    "column_name": "contact_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_message_participants",
    "column_name": "participant_role",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_message_participants",
    "column_name": "email",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_message_participants",
    "column_name": "full_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_message_participants",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "mailbox_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "thread_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "client_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "provider_message_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "internet_message_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "sent_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "direction",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "sender_contact_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "subject",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "snippet",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "body_text",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "body_html",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "has_attachments",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false",
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "labels",
    "data_type": "ARRAY",
    "is_nullable": "NO",
    "column_default": "'{}'::text[]",
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "in_reply_to",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "references_list",
    "data_type": "ARRAY",
    "is_nullable": "NO",
    "column_default": "'{}'::text[]",
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "raw_payload",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'{}'::jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "email_messages",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null
  },
  {
    "table_name": "email_threads",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null
  },
  {
    "table_name": "email_threads",
    "column_name": "mailbox_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_threads",
    "column_name": "client_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_threads",
    "column_name": "match_status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'pending'::client_match_status",
    "character_maximum_length": null
  },
  {
    "table_name": "email_threads",
    "column_name": "provider_thread_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null
  },
  {
    "table_name": "email_threads",
    "column_name": "subject",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null
  }
]

Query:
SELECT 
  table_name,
  string_agg(
    column_name || ' ' || data_type || 
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ', ' ORDER BY ordinal_position
  ) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

Output:
[
  {
    "table_name": "action_items",
    "columns": "id uuid NOT NULL, client_id uuid, source_entity_type USER-DEFINED NOT NULL, source_entity_id uuid NOT NULL, meeting_id uuid, owner_team_member_id uuid, title text NOT NULL, details text, due_at timestamp with time zone, status USER-DEFINED NOT NULL, priority USER-DEFINED NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "ai_insights",
    "columns": "id uuid NOT NULL, entity_type USER-DEFINED NOT NULL, entity_id uuid NOT NULL, client_id uuid, model_name text NOT NULL, prompt_version text, sentiment_label USER-DEFINED, sentiment_score numeric, urgency_score numeric, complaint_flag boolean NOT NULL, satisfaction_flag boolean NOT NULL, needs_follow_up boolean NOT NULL, summary text, topics jsonb NOT NULL, risks jsonb NOT NULL, action_suggestions jsonb NOT NULL, raw_output jsonb NOT NULL, analyzed_at timestamp with time zone NOT NULL, created_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "business_holidays",
    "columns": "holiday_date date NOT NULL, name text NOT NULL, region text NOT NULL, created_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "business_rules",
    "columns": "id integer NOT NULL, timezone text NOT NULL, workday_start time without time zone NOT NULL, workday_end time without time zone NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "client_identifiers",
    "columns": "id uuid NOT NULL, client_id uuid NOT NULL, identifier_type USER-DEFINED NOT NULL, identifier_value text NOT NULL, confidence numeric NOT NULL, created_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "clients",
    "columns": "id uuid NOT NULL, name text NOT NULL, slug text, status USER-DEFINED NOT NULL, owner_team_member_id uuid, primary_domain USER-DEFINED, notes text, metadata jsonb NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "contacts",
    "columns": "id uuid NOT NULL, client_id uuid, full_name text, email USER-DEFINED NOT NULL, company_name text, title text, contact_type USER-DEFINED NOT NULL, metadata jsonb NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "email_message_participants",
    "columns": "id uuid NOT NULL, message_id uuid NOT NULL, contact_id uuid, participant_role USER-DEFINED NOT NULL, email USER-DEFINED NOT NULL, full_name text, created_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "email_messages",
    "columns": "id uuid NOT NULL, mailbox_id uuid NOT NULL, thread_id uuid NOT NULL, client_id uuid, provider_message_id text NOT NULL, internet_message_id text, sent_at timestamp with time zone NOT NULL, direction USER-DEFINED NOT NULL, sender_contact_id uuid, subject text, snippet text, body_text text, body_html text, has_attachments boolean NOT NULL, labels ARRAY NOT NULL, in_reply_to text, references_list ARRAY NOT NULL, raw_payload jsonb NOT NULL, created_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "email_threads",
    "columns": "id uuid NOT NULL, mailbox_id uuid NOT NULL, client_id uuid, match_status USER-DEFINED NOT NULL, provider_thread_id text NOT NULL, subject text, first_message_at timestamp with time zone, last_message_at timestamp with time zone, last_client_message_at timestamp with time zone, last_team_message_at timestamp with time zone, last_direction USER-DEFINED, message_count integer NOT NULL, status USER-DEFINED NOT NULL, raw_labels ARRAY NOT NULL, metadata jsonb NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "excluded_senders",
    "columns": "id uuid NOT NULL, value text NOT NULL, reason text, created_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "internal_access",
    "columns": "email USER-DEFINED NOT NULL, full_name text, role text NOT NULL, active boolean NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "mailboxes",
    "columns": "id uuid NOT NULL, team_member_id uuid, label text NOT NULL, email USER-DEFINED NOT NULL, provider text NOT NULL, is_active boolean NOT NULL, last_watch_expires_at timestamp with time zone, metadata jsonb NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "meeting_attendees",
    "columns": "id uuid NOT NULL, meeting_id uuid NOT NULL, contact_id uuid, email USER-DEFINED NOT NULL, full_name text, response_status USER-DEFINED NOT NULL, is_organizer boolean NOT NULL, created_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "meetings",
    "columns": "id uuid NOT NULL, mailbox_id uuid, client_id uuid, provider_event_id text NOT NULL, calendar_id text NOT NULL, title text NOT NULL, description text, start_at timestamp with time zone NOT NULL, end_at timestamp with time zone NOT NULL, timezone text, meeting_url text, location text, status USER-DEFINED NOT NULL, attendee_count integer NOT NULL, raw_payload jsonb NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "sync_cursors",
    "columns": "id uuid NOT NULL, integration_key text NOT NULL, cursor_value text NOT NULL, metadata jsonb NOT NULL, last_synced_at timestamp with time zone NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "team_members",
    "columns": "id uuid NOT NULL, full_name text NOT NULL, email USER-DEFINED NOT NULL, role text, active boolean NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "transcripts",
    "columns": "id uuid NOT NULL, meeting_id uuid, client_id uuid, source_type USER-DEFINED NOT NULL, drive_file_id text, external_document_id text, file_name text, document_url text, transcript_at timestamp with time zone, language_code text, content_text text NOT NULL, content_hash text, raw_payload jsonb NOT NULL, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL"
  },
  {
    "table_name": "v_client_activity_timeline",
    "columns": "client_id uuid, event_at timestamp with time zone, event_type text, source_id uuid, title text, preview text, metadata jsonb"
  },
  {
    "table_name": "v_client_kpis_30d",
    "columns": "client_id uuid, client_name text, client_status USER-DEFINED, emails_sent_30d bigint, emails_received_30d bigint, avg_client_response_hours_30d numeric, avg_team_response_hours_30d numeric, avg_client_response_natural_hours_30d numeric, avg_team_response_natural_hours_30d numeric, stalled_threads_gt_72h bigint, meetings_30d bigint, avg_meeting_minutes_30d numeric, negative_signals_30d bigint, positive_signals_30d bigint, open_actions bigint, overdue_actions bigint, risk_score_heuristic bigint"
  },
  {
    "table_name": "v_thread_response_events",
    "columns": "origin_message_id uuid, thread_id uuid, client_id uuid, origin_direction USER-DEFINED, response_type text, origin_sent_at timestamp with time zone, reply_message_id uuid, reply_sent_at timestamp with time zone, response_natural_hours numeric, response_business_hours numeric"
  }
]

Query:
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

Output:
[
  {
    "table_name": "action_items",
    "column_name": "owner_team_member_id",
    "foreign_table": "team_members",
    "foreign_column": "id"
  },
  {
    "table_name": "action_items",
    "column_name": "meeting_id",
    "foreign_table": "meetings",
    "foreign_column": "id"
  },
  {
    "table_name": "action_items",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "ai_insights",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "transcripts",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "transcripts",
    "column_name": "meeting_id",
    "foreign_table": "meetings",
    "foreign_column": "id"
  },
  {
    "table_name": "meeting_attendees",
    "column_name": "contact_id",
    "foreign_table": "contacts",
    "foreign_column": "id"
  },
  {
    "table_name": "meeting_attendees",
    "column_name": "meeting_id",
    "foreign_table": "meetings",
    "foreign_column": "id"
  },
  {
    "table_name": "meetings",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "meetings",
    "column_name": "mailbox_id",
    "foreign_table": "mailboxes",
    "foreign_column": "id"
  },
  {
    "table_name": "email_message_participants",
    "column_name": "contact_id",
    "foreign_table": "contacts",
    "foreign_column": "id"
  },
  {
    "table_name": "email_message_participants",
    "column_name": "message_id",
    "foreign_table": "email_messages",
    "foreign_column": "id"
  },
  {
    "table_name": "email_messages",
    "column_name": "sender_contact_id",
    "foreign_table": "contacts",
    "foreign_column": "id"
  },
  {
    "table_name": "email_messages",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "email_messages",
    "column_name": "thread_id",
    "foreign_table": "email_threads",
    "foreign_column": "id"
  },
  {
    "table_name": "email_messages",
    "column_name": "mailbox_id",
    "foreign_table": "mailboxes",
    "foreign_column": "id"
  },
  {
    "table_name": "email_threads",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "email_threads",
    "column_name": "mailbox_id",
    "foreign_table": "mailboxes",
    "foreign_column": "id"
  },
  {
    "table_name": "mailboxes",
    "column_name": "team_member_id",
    "foreign_table": "team_members",
    "foreign_column": "id"
  },
  {
    "table_name": "contacts",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "client_identifiers",
    "column_name": "client_id",
    "foreign_table": "clients",
    "foreign_column": "id"
  },
  {
    "table_name": "clients",
    "column_name": "owner_team_member_id",
    "foreign_table": "team_members",
    "foreign_column": "id"
  }
]