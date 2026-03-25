# Flux 02: Sync incremental de Gmail

## Objectiu

Sincronitzar només els canvis nous de cada mailbox i deixar els missatges preparats per a enriquiment amb IA.

## Trigger

`Schedule Trigger` cada 5 o 10 minuts.

## Nodes

1. `Postgres - Get active mailboxes`
   Llegeix `mailboxes where is_active = true`.

2. `Split In Batches - One mailbox at a time`

3. `Postgres - Read cursor`
   Llegeix `sync_cursors.integration_key = gmail_history::<mailbox_email>`.

4. `HTTP Request (Gmail history.list)`
   Crida l'endpoint incremental amb `startHistoryId`.

5. `IF - Has changes?`
   Si no hi ha canvis, passa al mailbox següent.

6. `HTTP Request (Gmail get message)`
   Recupera només els missatges afectats.

7. `Code - Normalize and classify`
   Mateixa transformació que al flux inicial.

8. `Postgres - Upsert contacts / threads / messages / participants`
   Reutilitza la mateixa lògica de persistència.

9. `Postgres - Update thread status`
   Regla simple MVP:
   - últim missatge del client => `waiting_team`
   - últim missatge de l'equip => `waiting_client`

10. `Postgres - Queue AI work`
    Desa una fila o marca a `email_messages.raw_payload` perquè el flux d'IA sàpiga quins missatges són nous.

11. `Postgres - Update sync cursor`
    Desa la nova `historyId`.

## Notes

- Si Gmail retorna `startHistoryId too old`, rellança el flux 01 per aquell mailbox.
- Si vols quasi temps real, més endavant pots afegir `watch` + webhook, però per MVP el cron cada pocs minuts és suficient.
