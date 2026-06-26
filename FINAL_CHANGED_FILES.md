# Final Changed Files (Stabilization Baseline)

Snapshot of files touched during the stabilization pass leading to the
ship-mode baseline. Auth, schema, and ProductCard layout were intentionally
left untouched per scope rules.

## Image stability fix
- `src/components/common/ThumbImage.tsx` — new shared image component with
  placeholder, onLoad reveal, onError fallback (no infinite loop), fixed
  dimensions to prevent layout jump.
- `src/components/ProductCard.tsx` — swapped raw `<img>` for `ThumbImage`.
- `src/components/TrendingSection.tsx` — swapped raw `<img>` for `ThumbImage`.

## Vertical routing / theme correctness
- `src/components/VerticalThemeWrapper.tsx` — URL `?vertical=` is the source
  of truth on `/browse`; `LUXE_ROUTES` forces brand theme on `/`, `/login`,
  `/install`, `/pricing`; `/rides*` forces `xhiro`.
- `src/pages/Homepage.tsx` — category click sets vertical context and
  navigates to `/browse?vertical=<slug>`.
- `src/pages/Index.tsx` — reads `?vertical=` from URL and syncs context so
  refresh / back-forward preserve the selected vertical.

## Vertical color system propagation
- `src/index.css` — vertical-scoped CSS variables under
  `[data-vertical="market|rent|services|luxe|jobs|xhiro"]` so background,
  primary, accent, ring, and glow tokens all flip together. No component-
  level color hardcoding remains relevant to the bug.

## Untouched on purpose
- `src/hooks/useAuth.tsx`, `src/integrations/supabase/*`, `supabase/migrations/*`
- `src/components/ProductCard.tsx` layout (only `<img>` swap inside)
- Any homepage redesign / routes / schema
