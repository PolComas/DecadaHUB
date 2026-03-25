# Flux 06: Refresh de KPI i alertes

## Objectiu

Exposar mètriques agregades al dashboard i detectar clients que requereixen atenció.

## Trigger

`Schedule Trigger` cada nit i un refresc més lleuger cada hora.

## Nodes

1. `Postgres - Query v_client_kpis_30d`

2. `Code - Apply business rules`
   Exemples:
   - `risk_score_heuristic >= 6`
   - `avg_team_response_hours_30d > 48`
   - `negative_signals_30d >= 3`
   - `overdue_actions > 0`

3. `IF - Needs alert?`

4. `Slack / Email`
   Envia resum intern amb clients calents.

5. `Postgres - Optional snapshot table`
   Si després vols històric de KPIs, crea una taula `client_kpi_snapshots` i guarda una foto diària.

## Notes

- El dashboard pot llegir directament les vistes SQL per a l'MVP.
- L'snapshot diari és útil quan vulguis gràfiques de tendència sense recalcular-ho tot.
