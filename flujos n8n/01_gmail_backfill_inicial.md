# Flux 01: Backfill inicial de Gmail

## Objectiu

Carregar l'històric inicial dels 2 comptes Gmail a Supabase sense aplicar IA encara. Aquest flux s'executa manualment per mailbox i, idealment, limitat als darrers 6 o 12 mesos.

## Nodes

1. `Manual Trigger`
   Executa el flux només quan vulguis fer una càrrega inicial.

2. `Set - Config mailbox`
   Defineix:
   - `mailbox_email`
   - `mailbox_label`
   - `from_date`
   - `max_pages`

3. `Postgres - Ensure mailbox exists`
   Fa `upsert` de la fila a `mailboxes`.

4. `Gmail` o `HTTP Request (Gmail API list messages)`
   Cerca missatges del compte:
   - query recomanada: `after:YYYY/MM/DD -in:chats`
   - recupera `id`, `threadId`, `internalDate`, labels i capçaleres bàsiques

5. `Split In Batches`
   Processa els missatges en lots petits per evitar timeouts.

6. `HTTP Request (Gmail API get message full)`
   Recupera el detall complet del missatge en format `full`.

7. `Code - Normalize email`
   Calcula:
   - `direction` (`team_to_client`, `client_to_team`, `internal`)
   - `subject`
   - `snippet`
   - `body_text`
   - `participants`
   - `internet_message_id`
   - `references_list`

8. `Postgres - Resolve client/contact`
   Ordre recomanat:
   - mirar si algun email o domini existeix a `client_identifiers`
   - si no existeix, crear `contacts`
   - si el match no és clar, deixar `client_id = null` i `match_status = 'manual_review'`

9. `Postgres - Upsert thread`
   Taula `email_threads` amb:
   - `mailbox_id`
   - `provider_thread_id`
   - `client_id`
   - `subject`
   - dates agregades del fil

10. `Postgres - Upsert message`
    Taula `email_messages`.

11. `Postgres - Upsert message participants`
    Taula `email_message_participants`.

12. `Postgres - Refresh thread aggregates`
    Recalcula `message_count`, `first_message_at`, `last_message_at`, `last_client_message_at`, `last_team_message_at`, `last_direction`.

13. `Postgres - Save sync cursor`
    Desa a `sync_cursors` la `historyId` més alta observada per aquell mailbox.

## Notes

- No facis IA en aquest flux. Primer entra la dada neta.
- Si el volum és alt, fes el backfill per finestres: 90 dies, després 180, després 365.
- Si el node Gmail es queda curt, usa `HTTP Request` amb OAuth de Google.
