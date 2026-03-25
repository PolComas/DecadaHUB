# Context del projecte

## Què estem construint

Un HUB intern per a l'equip de màrqueting d'Amazon que unifica:

- emails de 2 comptes Gmail
- reunions de Google Calendar
- transcripts de reunions en Google Docs o Word
- insights generats amb IA

L'objectiu no és només visualitzar correus, sinó entendre l'estat real de cada client: volum, velocitat de resposta, queixes, to, accions pendents i risc.

## Stack recomanat

- `n8n` per ingestió, ETL i orquestració
- `Supabase Postgres` per model de dades i consultes
- `Next.js / React` per al panel
- `OpenAI` per resum, sentiment, detecció de queixa i accions

## MVP recomanat

### Fase 1

- ingestió Gmail
- ingestió Calendar
- taules i vistes KPI
- fitxa de client
- mètriques bàsiques:
  - emails enviats i rebuts
  - temps de resposta client i equip
  - fils estancats
  - reunions per client

### Fase 2

- resum automàtic de threads
- sentiment i detecció de queixa
- resum de transcripts
- accions pendents automàtiques

### Fase 3

- alertes de risc
- scoring de salut del client
- comparatives entre account managers
- tendències temporals

## Decisió tècnica important

La clau del producte és el `client matching`.

Si no sabem assignar correctament emails, reunions i transcripts al client correcte, el dashboard no serà fiable. Per això el model inclou:

- `client_identifiers`
- `contacts`
- `mailboxes`
- `email_threads`
- `meetings`
- `transcripts`

## Ordre d'implementació recomanat

1. Crear el projecte Supabase i executar `querys/001_schema.sql`.
2. Executar `querys/002_views_kpis.sql`.
3. Donar d'alta els 2 mailboxes a `mailboxes`.
4. Muntar el flux 01 de backfill.
5. Muntar el flux 02 incremental.
6. Muntar el flux 03 de Calendar.
7. Confirmar la font real dels transcripts i muntar el flux 04.
8. Quan la dada sigui estable, afegir el flux 05 d'IA.
9. Fer el frontend sobre `v_client_kpis_30d` i `v_client_activity_timeline`.

## Riscos reals

- transcripts desordenats o sense convenció de nom
- clients amb múltiples dominis o múltiples marques
- temps de resposta mal definit si no pactem la regla
- biaix de sentiment si el prompt no és consistent
- duplicats de reunions si hi ha diversos calendaris interns

## Criteri d'èxit de l'MVP

El MVP és bo si l'equip pot entrar a una fitxa de client i veure, amb fiabilitat raonable:

- darrers correus i reunions
- temps de resposta
- fils oberts o estancats
- resum de les últimes interaccions
- accions pendents
