# Flux 05: Enriquiment amb IA

## Objectiu

Analitzar emails i transcripts nous, generar insights estructurats i crear `action_items`.

## Trigger

`Schedule Trigger` cada 10 minuts o subworkflow cridat pels fluxos 02 i 04.

## Nodes

1. `Postgres - Fetch pending email messages`
   Selecciona missatges sense entrada a `ai_insights`.

2. `Postgres - Fetch pending transcripts`
   Selecciona transcripts sense entrada a `ai_insights`.

3. `Merge`
   Uneix les dues cues.

4. `Split In Batches`
   Processa una peça cada vegada.

5. `Code - Build prompt payload`
   Entrada mínima recomanada:
   - `entity_type`
   - `entity_id`
   - `client_id`
   - text net
   - participants
   - context bàsic del fil o reunió

6. `OpenAI`
   Demana resposta estrictament estructurada en JSON amb:
   - `summary`
   - `sentiment_label`
   - `sentiment_score`
   - `complaint_flag`
   - `satisfaction_flag`
   - `needs_follow_up`
   - `urgency_score`
   - `topics[]`
   - `risks[]`
   - `action_items[]`

7. `Code - Validate model output`
   Si el JSON no és vàlid, reintenta o envia a una cua d'errors.

8. `Postgres - Insert ai_insights`

9. `Postgres - Upsert action_items`
   Una fila per cada acció detectada.

10. `IF - High risk?`
    Si `complaint_flag = true` o `urgency_score >= 0.8`, llança alerta.

11. `Slack / Email / Telegram`
    Alerta interna opcional per l'equip.

## Notes

- No facis un prompt massa "creatiu". Demana camp per camp.
- Guarda sempre el JSON brut a `raw_output`.
- Reprocessa només quan canvïi el prompt o el model.
