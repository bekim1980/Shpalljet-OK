# Environment Setup

## Which Supabase project is used?

Vite loads env files in this order (later wins):

1. `.env` — optional committed defaults (may be stale; prefer `.env.local` or host env)
2. `.env.local` — local overrides (**not committed**; takes precedence in dev)

| File | Project ID | When it applies |
|---|---|---|
| `.env` | `aybngrlutsfvapxtgqkg` | Fallback when `.env.local` is absent (e.g. CI, fresh clone, `npm run build` without local overrides) |
| `.env.local` | `xbignrigchholsrbnvhl` | **Local dev** (`npm run dev`) — overrides `.env` automatically |

The app reads **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_PUBLISHABLE_KEY`** from
`src/integrations/supabase/client.ts`. With `.env.local` present, dev connects to
**`xbignrigchholsrbnvhl`**. Without it, builds fall back to **`aybngrlutsfvapxtgqkg`**.

> **Do not commit `.env.local`.** Do not paste keys or passwords into chat or docs.
> For production deploys, set `VITE_SUPABASE_*` in the hosting provider to the
> For production deploys, set `VITE_SUPABASE_*` and `VITE_SITE_URL` in the hosting provider.

## Required runtime env vars

| Variable | Used by |
|---|---|
| `VITE_SUPABASE_URL` | `src/integrations/supabase/client.ts` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client (publishable/anon key, safe in browser) |
| `VITE_SITE_URL` | SEO canonical URLs, OG tags (`src/lib/siteUrl.ts`) |
| `VITE_SUPABASE_PROJECT_ID` | tooling (`supabase/config.toml`, scripts) |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | scripts / edge fn local dev |

Copy `.env.example` to `.env.local` for local development. Do not commit real keys.

## Local dev
```sh
nvm use            # Node 18+ recommended
npm install
cp .env.example .env.local
npm run dev        # vite on :8080
```
Create **`.env.local`** with your target project's `VITE_SUPABASE_*` values.
Vite merges it over `.env`; you do not need to edit the committed `.env`.

## Edge function secrets
Configured via Supabase dashboard or `supabase secrets set`. Functions
(`ai-assistant`, `expire-listings`, `saved-search-runner`) rely on
`SUPABASE_*` service-role secrets.

## Storage buckets
- `product-images` (public read) — listing photos.
- `avatars` (public read) — profile pictures.
Bucket policies are defined in migrations; do not edit via the dashboard.

## Tooling versions
- Node ≥ 18
- npm ≥ 10
- TypeScript 5 (via project)
- Vite 5
