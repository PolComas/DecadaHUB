# DecadaHUB

Frontend intern per visualitzar la salut dels clients a partir de:

- emails sincronitzats a Supabase
- reunions de Calendar
- transcripts de reunions
- insights i accions generades amb IA

## Requisits

- Node.js 24+
- npm 11+
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Desenvolupament

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## SQL necessari

Executa, com a mínim:

- `querys/001_schema.sql`
- `querys/003_business_calendar.sql`
- `querys/004_views_business_hours.sql`

Per accés real amb auth + RLS:

- `querys/008_auth_rls.sql`
- `querys/009_internal_access_seed.sql`
- `querys/010_secure_views.sql`

Per dades demo:

- `querys/005_seed_demo_data.sql`
- `querys/007_fix_transcripts_upsert.sql` si la BD es va crear abans del fix d'índexs

## Pantalles implementades

- dashboard global de cartera
- login amb magic link de Supabase
- sidebar amb cartera filtrable
- fitxa detallada de client amb ruta pròpia `/clients/:clientId`
- timeline d'activitat
- reunions, fils, insights i accions pendents

## Setup d'auth

1. Activa Email auth a Supabase.
2. Afegeix `http://localhost:5173` i el domini final als Redirect URLs.
3. Executa `querys/008_auth_rls.sql`.
4. Edita i executa `querys/009_internal_access_seed.sql`.
5. Executa `querys/010_secure_views.sql`.
6. Entra des del login amb un email que existeixi a `internal_access`.
