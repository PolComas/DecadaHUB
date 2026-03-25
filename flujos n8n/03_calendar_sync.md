# Flux 03: Sync de Google Calendar

## Objectiu

Portar reunions a Supabase i relacionar-les amb els clients.

## Trigger

`Schedule Trigger` cada 15 o 30 minuts.

## Nodes

1. `Postgres - Get active mailboxes`
   Per cada compte Gmail, sincronitza també el seu calendari principal.

2. `Split In Batches`

3. `Google Calendar - Get many events`
   Finestra recomanada:
   - `from = now() - 30 days`
   - `to = now() + 60 days`

4. `Code - Normalize event`
   Extreu:
   - `provider_event_id`
   - `title`
   - `description`
   - `start_at`, `end_at`
   - `meeting_url`
   - `attendees`

5. `Postgres - Resolve client`
   Prioritat de match:
   - assistents amb email que existeix a `client_identifiers`
   - domini dels assistents
   - keyword manual del títol o descripció

6. `Postgres - Upsert meeting`
   Taula `meetings`.

7. `Postgres - Upsert attendees`
   Taula `meeting_attendees`.

8. `IF - Meeting ended recently?`
   Si la reunió ha acabat en les darreres 24 hores, enviar-la al flux de transcripts.

## Notes

- Si diversos membres interns són convidats a la mateixa reunió, al principi pot haver-hi duplicats. El criteri de deduplicació pot ser `meeting_url + start_at`.
- Si el client no es pot resoldre bé, deixa `client_id` buit i revisa manualment.
