# ClubStats — Architecture

## High-level

```
┌─────────────────────┐      ┌────────────────────┐
│  Play Cricket       │◄─────│  Scraper (Cron)    │
│  (per-club login)   │      │  GitHub Actions    │
└─────────────────────┘      │  Playwright + TS   │
                             └────────────────────┘
                                       │
                                       ▼  writes JSON
                             ┌────────────────────┐
                             │  git repo          │
                             │  /data/<club>/*.json│
                             └────────────────────┘
                                       │
                                       ▼  push triggers
                             ┌────────────────────┐
                             │  Vercel build      │
                             │  Astro static site │
                             └────────────────────┘
                                       │
                                       ▼  deploys
                             ┌────────────────────┐
                             │  clubstats.uk/*    │
                             └────────────────────┘
```

## Why static-first

Each dashboard is fundamentally a view of a JSON file that changes ≤ once a
week. There is no per-user state, no real-time updates, no logged-in features
(yet). This means:

- A static build (one HTML per club, generated at build time) is the right
  shape for v1
- No server cost — Vercel's free tier handles it
- Page-load is instant; data is pre-baked into the page
- For ClubStats Pro features that need interactivity (filters, expand rows),
  small React islands handle that client-side

When we add fantasy leagues (user accounts, persistent picks), we'll move to
SSR + a database. Astro supports that migration cleanly.

## Data flow

1. **Capture** — Playwright logs in, scrapes Statistics + scorecards, writes
   `data/<club>/dashboard_data.json`
2. **Commit** — GitHub Action commits the data change to `main`
3. **Build** — Vercel rebuilds Astro; each `data/<club>/*.json` becomes a route
4. **Cache** — Vercel CDN caches the static HTML; clients get sub-100ms loads

## Components

### Scraper
- Pure TypeScript, runs in Node + Playwright Chromium
- One entry point: `scraper/capture.ts`
- Configured via `scraper/clubs.config.ts`
- Outputs deterministic JSON (stable key ordering, so diffs are minimal)
- Handles auth, retries, rate-limiting

### Site
- Astro framework
- `src/pages/index.astro` — marketing landing
- `src/pages/[club].astro` — generated for each club via `getStaticPaths`
- React islands for interactive bits (`Filters`, `Leaderboard`, `RecentMatches`)
- Tailwind for all styling, with per-club theme tokens

### Data layer
- Per-club JSON files committed to git
- Schema documented in `docs/data-schema.md`
- A single typed loader: `src/lib/loadClubData(slug)` returns a typed object

### Theming
- `src/lib/themes.ts` exports a `ClubTheme` for each club
- Tailwind config picks these up as CSS variables
- Per-club brand colours and crest

## Deployment

- **Main branch → production** (`clubstats.uk`)
- **Pull requests → preview deploys** (`clubstats-pr-N.vercel.app`)
- **Manual workflow_dispatch on the refresh action** for ad-hoc updates

## Observability

- Vercel deployment logs
- GitHub Actions logs for the scraper
- Optionally: Sentry for runtime errors in the scraper
- Healthcheck endpoint `/api/health` (returns last-refresh timestamp per club)

## Future-proofing

When we add Pro features:
- **Player profiles**: add `/[club]/players/[playerId].astro` generated from
  scorecard-derived per-innings data
- **Fantasy**: probably becomes its own product on a subdomain with a real
  backend (Hono / Cloudflare Workers + KV) — but data layer is shared
- **Embedded widgets**: build a separate `/embed/[club].astro` that's
  iframe-friendly (no nav, no footer)
- **PDF reports**: server-side render with Playwright to PDF; cache result
