# Prompts per generar els fluxos n8n de DecadaHUB

Copia i enganxa cada prompt a la IA de n8n o a Claude perquè et generi el workflow.
Abans de cada flux, assegura't de tenir les credencials configurades a n8n (Gmail OAuth, Google Calendar, Supabase/Postgres, OpenAI, Slack).

---

## Context comú (inclou-lo al principi de cada prompt si la IA no té memòria)

```
Estic construint un sistema de monitoratge de comunicació amb clients.
Base de dades: Supabase (PostgreSQL). Les taules principals són:

- mailboxes (id uuid PK, team_member_id uuid FK, label text, email citext UNIQUE, provider text, is_active bool)
- email_threads (id uuid PK, mailbox_id uuid FK, provider_thread_id text UNIQUE, client_id uuid FK, subject text, status thread_status_enum [open|waiting_client|waiting_team|closed], first_message_at timestamptz, last_message_at timestamptz, message_count int, last_direction message_direction_enum)
- email_messages (id uuid PK, thread_id uuid FK, client_id uuid FK, provider_message_id text UNIQUE, internet_message_id text, subject text, snippet text, body_text text, sent_at timestamptz, direction message_direction_enum [team_to_client|client_to_team|internal], raw_payload jsonb)
- email_message_participants (id uuid PK, message_id uuid FK, email citext, name text, role text [from|to|cc])
- client_identifiers (id uuid PK, client_id uuid FK, identifier_type enum [domain|email|calendar_guest|doc_keyword|manual], value citext)
- contacts (id uuid PK, client_id uuid FK, full_name text, email citext UNIQUE, company_name text, contact_type enum [team|client|external])
- meetings (id uuid PK, client_id uuid FK, provider_event_id text, title text, description text, start_at timestamptz, end_at timestamptz, timezone text, meeting_url text, status text)
- meeting_attendees (id uuid PK, meeting_id uuid FK, email citext, name text, response_status text)
- transcripts (id uuid PK, meeting_id uuid FK, client_id uuid FK, source_type text, file_name text, document_url text, drive_file_id text, content_text text, transcript_at timestamptz, language_code text)
- ai_insights (id uuid PK, client_id uuid FK, entity_type text, entity_id uuid, summary text, sentiment_label enum [positive|neutral|negative|mixed], sentiment_score numeric, urgency_score numeric, complaint_flag bool, satisfaction_flag bool, needs_follow_up bool, topics jsonb, risks jsonb, raw_output jsonb, analyzed_at timestamptz)
- action_items (id uuid PK, client_id uuid FK, title text, details text, due_at timestamptz, status enum [open|in_progress|done|cancelled], priority enum [low|medium|high|critical], meeting_id uuid FK)
- sync_cursors (id uuid PK, integration_key text UNIQUE, cursor_value text, updated_at timestamptz)
- clients (id uuid PK, name text, slug text, status client_status_enum, owner_team_member_id uuid FK, primary_domain text, notes text)

Totes les PK uuid es generen amb gen_random_uuid(). Tots els upserts utilitzen ON CONFLICT ... DO UPDATE.
```

---

## Flux 01 — Gmail Backfill Inicial

```
Crea'm un workflow n8n per fer un backfill inicial de Gmail.

Trigger: Manual Trigger.

Pas 1 - Set node "Config":
- mailbox_email (string): l'email del mailbox compartit
- mailbox_label (string): nom descriptiu
- from_date (string): data d'inici en format YYYY/MM/DD (recomanat 6-12 mesos enrere)
- max_pages (number): pàgines màximes de resultats Gmail (default 50)

Pas 2 - Postgres "Upsert mailbox":
- INSERT INTO mailboxes (email, label, provider, is_active) VALUES ($mailbox_email, $mailbox_label, 'gmail', true)
  ON CONFLICT (email) DO UPDATE SET label = EXCLUDED.label, is_active = true

Pas 3 - Gmail node "List messages":
- Usar operació "Get Many" amb query: "after:{{from_date}} -in:chats"
- Limitar a max_pages * 100 missatges
- Retorna: id, threadId

Pas 4 - Split In Batches (batch size: 10)

Pas 5 - Gmail node "Get message":
- Per cada id, obtenir el missatge complet (format: full)
- Extreure: From, To, Cc, Subject, Date, Message-ID, References, snippet, body

Pas 6 - Code node "Normalitza email":
- Classificar direction:
  · Si From conté el mailbox_email → "team_to_client"
  · Si From NO conté el mailbox_email i To/Cc SÍ → "client_to_team"
  · Si From i To són internes → "internal"
- Extreure tots els participants (from, to, cc) com a array [{email, name, role}]
- Netejar subject (treure Re:/Fwd:)
- Extreure body_text del payload

Pas 7 - Postgres "Resolve or create client":
- Usa la funció resolve_or_create_client que auto-crea clients:
  SELECT * FROM resolve_or_create_client($from_email, $from_domain)
- Retorna: client_id (uuid o null) i auto_created (boolean)
- Lògica interna:
  1. Busca a client_identifiers per email/domini → si existeix, retorna client_id
  2. Busca a excluded_senders → si exclòs, retorna NULL (no crea res)
  3. Si no exclòs ni trobat: crea client nou amb nom=domini, crea identifier, retorna client_id
- IMPORTANT: configura "Always Output Data = true" al node Postgres

Pas 8 - Postgres "Upsert thread":
- INSERT INTO email_threads (mailbox_id, provider_thread_id, client_id, subject, first_message_at, last_message_at, message_count, last_direction, status)
  ON CONFLICT (provider_thread_id) DO UPDATE SET last_message_at, message_count, last_direction, status, client_id

Pas 9 - Postgres "Upsert message":
- INSERT INTO email_messages (thread_id, client_id, provider_message_id, internet_message_id, subject, snippet, body_text, sent_at, direction, raw_payload)
  ON CONFLICT (provider_message_id) DO UPDATE SET ...

Pas 10 - Postgres "Upsert participants":
- Per cada participant: INSERT INTO email_message_participants (message_id, email, name, role)

Pas 11 - Postgres "Update thread aggregates":
  UPDATE email_threads SET
    message_count = (SELECT count(*) FROM email_messages WHERE thread_id = $thread_id),
    first_message_at = (SELECT min(sent_at) FROM email_messages WHERE thread_id = $thread_id),
    last_message_at = (SELECT max(sent_at) FROM email_messages WHERE thread_id = $thread_id),
    last_direction = (SELECT direction FROM email_messages WHERE thread_id = $thread_id ORDER BY sent_at DESC LIMIT 1)
  WHERE id = $thread_id

Pas 12 - Postgres "Save sync cursor":
- INSERT INTO sync_cursors (integration_key, cursor_value)
  VALUES ('gmail_history::' || $mailbox_email, $highest_historyId)
  ON CONFLICT (integration_key) DO UPDATE SET cursor_value = EXCLUDED.cursor_value

NO facis cap processament d'IA en aquest flux. Només ingestió de dades.
```

---

## Flux 02 — Gmail Sync Incremental

```
Crea'm un workflow n8n per sincronitzar Gmail de forma incremental.

Trigger: Schedule Trigger cada 5 minuts.

Pas 1 - Postgres "Get active mailboxes":
- SELECT m.id, m.email FROM mailboxes m WHERE m.is_active = true

Pas 2 - Split In Batches (1 mailbox a la vegada)

Pas 3 - Postgres "Read sync cursor":
- SELECT cursor_value FROM sync_cursors WHERE integration_key = 'gmail_history::' || $mailbox_email

Pas 4 - HTTP Request "Gmail history.list":
- GET https://gmail.googleapis.com/gmail/v1/users/me/history
- Query params: startHistoryId=$cursor_value, historyTypes=messageAdded
- Auth: OAuth2 Gmail
- Si error "startHistoryId too old" → Avisar que cal re-executar Flux 01

Pas 5 - IF "Has changes?":
- Si history.length == 0 → Skip, anar al següent mailbox

Pas 6 - Extreure message IDs nous del history response

Pas 7 - Gmail "Get message" per cada ID nou (format: full)

Pas 8 - Code "Normalitza" (mateixa lògica que Flux 01, pas 6)

Pas 9 - Postgres upserts (mateixa lògica que Flux 01: thread, message, participants)

Pas 10 - Postgres "Update thread status":
- Si last_direction = 'client_to_team' → status = 'waiting_team'
- Si last_direction = 'team_to_client' → status = 'waiting_client'

Pas 11 - Postgres "Update sync cursor" amb el nou historyId més alt

Ús principal: capturar nous emails en quasi temps real sense reprocessar tot.
```

---

## Flux 03 — Calendar Sync

```
Crea'm un workflow n8n per sincronitzar Google Calendar.

Trigger: Schedule Trigger cada 15 minuts.

Pas 1 - Postgres "Get active mailboxes":
- SELECT id, email FROM mailboxes WHERE is_active = true
- (cada mailbox compartit Gmail té un calendari associat)

Pas 2 - Split In Batches

Pas 3 - Google Calendar "Get Many Events":
- Calendar: primary (de cada mailbox)
- Rang: from = now() - 30 dies, to = now() + 60 dies
- Retorna: id, summary, description, start, end, hangoutLink, attendees

Pas 4 - Code "Normalitza event":
- Extreure: provider_event_id, title, description, start_at, end_at, meeting_url (de hangoutLink o conferenceData), timezone
- Extreure attendees com a array [{email, name, response_status}]

Pas 5 - Postgres "Resolve client":
- Buscar atenent per atenent a client_identifiers:
  SELECT ci.client_id FROM client_identifiers ci
  WHERE ci.value IN ($attendee_emails) OR ci.value IN ($attendee_domains)
  LIMIT 1
- Si no es resol, deixar client_id = null

Pas 6 - Postgres "Upsert meeting":
- INSERT INTO meetings (provider_event_id, client_id, title, description, start_at, end_at, timezone, meeting_url, status)
  ON CONFLICT (provider_event_id) DO UPDATE SET ...

Pas 7 - Postgres "Upsert attendees":
- Per cada attendee: INSERT INTO meeting_attendees (meeting_id, email, name, response_status)

No cal processament d'IA. Només ingestió de calendari.
```

---

## Flux 04 — Transcripts Ingesta

```
Crea'm un workflow n8n per ingerir transcripts de reunions des de Google Drive.

Trigger: Schedule Trigger cada hora.

Pas 1 - Google Drive "List files in folder":
- Folder ID configurable (la carpeta on es guarden transcripts)
- Filtrar per modifiedTime > última execució

Pas 2 - Postgres "Check if already ingested":
- SELECT id FROM transcripts WHERE drive_file_id = $file_id
- Si existeix, skip

Pas 3 - Switch "File type":
- Google Doc (mimeType = application/vnd.google-apps.document) → branca A
- DOCX/text → branca B

Pas 4A - Google Docs "Get document text" (per Google Docs)
Pas 4B - Google Drive "Download" + Code "Extract text" (per DOCX)

Pas 5 - Code "Resolve meeting":
- Intentar coincidir per nom de fitxer (format recomanat: YYYY-MM-DD__NomClient__Títol)
- Si no, buscar reunió per data ± 24h:
  SELECT id, client_id FROM meetings
  WHERE start_at::date = $file_date AND client_id IS NOT NULL
  LIMIT 1
- Assignar meeting_id i client_id si es troben

Pas 6 - Postgres "Upsert transcript":
- INSERT INTO transcripts (meeting_id, client_id, source_type, file_name, document_url, drive_file_id, content_text, transcript_at)
  ON CONFLICT ON CONSTRAINT transcripts_drive_file_unique_idx DO UPDATE SET content_text = EXCLUDED.content_text

El flux NO fa anàlisi IA. Només ingestió. El flux 05 processarà els transcripts pendents.
```

---

## Flux 05 — Enriquiment amb IA

```
Crea'm un workflow n8n per analitzar emails i transcripts amb IA (OpenAI).

Trigger: Schedule Trigger cada 10 minuts.

Pas 1 - Postgres "Fetch pending emails":
  SELECT em.id as entity_id, 'email_message' as entity_type, em.client_id,
         em.subject, em.body_text, em.direction, em.sent_at
  FROM email_messages em
  WHERE em.client_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM ai_insights ai WHERE ai.entity_id = em.id AND ai.entity_type = 'email_message')
  ORDER BY em.sent_at DESC
  LIMIT 20

Pas 2 - Postgres "Fetch pending transcripts":
  SELECT t.id as entity_id, 'transcript' as entity_type, t.client_id,
         t.file_name as subject, t.content_text as body_text, 'internal' as direction, t.transcript_at as sent_at
  FROM transcripts t
  WHERE t.client_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM ai_insights ai WHERE ai.entity_id = t.id AND ai.entity_type = 'transcript')
  ORDER BY t.transcript_at DESC
  LIMIT 10

Pas 3 - Merge (combinar ambdues llistes)

Pas 4 - Split In Batches (1 a la vegada per no saturar la API)

Pas 5 - Code "Build prompt":
Construir un prompt amb aquest format:

"""
Analitza el següent contingut de comunicació empresarial.
Respon EXCLUSIVAMENT en JSON vàlid amb aquesta estructura exacta:
{
  "summary": "resum breu en 1-2 frases del contingut",
  "sentiment_label": "positive" | "neutral" | "negative" | "mixed",
  "sentiment_score": número entre -1.0 i 1.0,
  "complaint_flag": true/false,
  "satisfaction_flag": true/false,
  "needs_follow_up": true/false,
  "urgency_score": número entre 0.0 i 1.0,
  "topics": ["topic1", "topic2"],
  "risks": ["risk1", "risk2"],
  "action_items": [{"text": "descripció de l'acció", "priority": "low|medium|high|critical"}]
}

Tipus: {{entity_type}}
Assumpte: {{subject}}
Direcció: {{direction}}
Data: {{sent_at}}
Contingut:
{{body_text}}
"""

Pas 6 - OpenAI node:
- Model: gpt-4o-mini (per cost) o gpt-4o (per qualitat)
- Temperature: 0.1
- Response format: JSON

Pas 7 - Code "Validate response":
- Parsejar el JSON retornat
- Validar que tots els camps existeixen
- Si falla el parse → saltar i logar error

Pas 8 - Postgres "Insert ai_insights":
  INSERT INTO ai_insights (entity_type, entity_id, client_id, summary, sentiment_label,
    sentiment_score, urgency_score, complaint_flag, satisfaction_flag, needs_follow_up,
    topics, risks, raw_output, analyzed_at)
  VALUES ($entity_type, $entity_id, $client_id, $summary, $sentiment_label,
    $sentiment_score, $urgency_score, $complaint_flag, $satisfaction_flag, $needs_follow_up,
    $topics::jsonb, $risks::jsonb, $raw_output::jsonb, now())

Pas 9 - Postgres "Upsert action_items" (per cada action_item detectat):
  INSERT INTO action_items (client_id, title, details, status, priority)
  VALUES ($client_id, $action_text, 'Generat automàticament per IA', 'open', $priority)

Pas 10 - IF "High risk?":
- SI complaint_flag = true O urgency_score >= 0.8 → enviar alerta
- Slack/Email amb: nom client, resum, score d'urgència
```

---

## Flux 06 — Refresh KPIs i Alertes

```
Crea'm un workflow n8n per revisar KPIs i enviar alertes.

Trigger: Schedule Trigger diari a les 08:00 (Europe/Madrid).

Pas 1 - Postgres "Query KPIs":
  SELECT * FROM v_client_kpis_30d ORDER BY risk_score_heuristic DESC

Pas 2 - Code "Filter alert-worthy clients":
- Filtrar clients que compleixin QUALSEVOL d'aquestes condicions:
  · risk_score_heuristic >= 6
  · avg_team_response_hours_30d > 48
  · negative_signals_30d >= 3
  · overdue_actions > 0

Pas 3 - IF "Hi ha clients per alertar?":
- Si no n'hi ha → aturar

Pas 4 - Code "Format message":
- Construir un missatge amb format:
  "🔴 CLIENT: nom_client | Risk: X | Resposta equip: Xh | Senyals neg: X | Accions vençudes: X"
- Un bloc per cada client que necessita atenció

Pas 5 - Slack/Email "Send alert":
- Enviar al canal d'equip o email configurat
- Títol: "DecadaHUB — Resum diari de cartera"

Pas 6 (opcional) - Postgres "Snapshot KPIs":
  INSERT INTO client_kpi_snapshots (client_id, snapshot_date, risk_score_heuristic,
    avg_team_response_hours_30d, negative_signals_30d, overdue_actions)
  SELECT client_id, CURRENT_DATE, risk_score_heuristic,
    avg_team_response_hours_30d, negative_signals_30d, overdue_actions
  FROM v_client_kpis_30d

Nota: la taula client_kpi_snapshots ja existeix a l'esquema. El snapshot permet veure tendències al llarg del temps.
```
