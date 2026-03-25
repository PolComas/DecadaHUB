# Decisions confirmades

## Fonts de dades

- transcripts: tots en Google Docs
- una sola carpeta de transcripts
- només s'analitzen els últims 6 mesos i el nou que entri després
- els 2 Gmail són comptes compartits i l'equip només opera des d'aquests

## Implicacions tècniques

- no podem confiar gaire en el domini perquè molts clients usen Gmail personal
- el `matching` ha de prioritzar:
  - email exacte del contacte
  - participants de reunions
  - paraules clau manuals

## KPI pactats

- temps de resposta en hores laborables
- assumit per ara:
  - timezone `Europe/Madrid`
  - jornada `09:00 -> 19:00`
- caps de setmana exclosos
- festius exclosos
- `client response`: qualsevol missatge del client dins del fil
- `stalled thread`: més de 72 hores

## Producte

- panel només intern
- podem fer aplicació pròpia, no cal BI pur
- exportacions no són prioritàries

## Compliance

- es pot processar emails i transcripts amb IA
- no hi ha cap filtre extra de NDA previst ara mateix

## Punt encara pendent

- necessitem la llista real de festius que voleu excloure del càlcul
