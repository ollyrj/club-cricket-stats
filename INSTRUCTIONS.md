# ClubStats — Claude Code Handover

This document is the brief for turning the ClubStats prototype into a proper
production web project. Read it end-to-end before starting.

---

## 0. What this product is

**ClubStats** turns a UK cricket club's Play Cricket data into a beautiful,
shareable, mobile-friendly stats dashboard.

A working prototype already exists as a single self-contained HTML file. Two
clubs are live as static demos:

- Sunbury CC: https://litter.catbox.moe/fhc96x.html (4 seasons, 6 XIs)
- Roe Green CC: https://litter.catbox.moe/1kb578.html (4 seasons, 3 XIs)

These URLs expire (litterbox is a free anonymous host). The product needs a
permanent home.

A sales landing page also exists:
- https://litter.catbox.moe/d9q44d.html

## 1. Your job in one sentence

**Take the prototype, turn it into a properly-engineered Astro/Next + TypeScript
project with a scheduled scraper, deploy to Vercel on a custom domain, and make
it easy to add new clubs.**

---

## 2. What we already have (in this folder)

```
clubstats-handover/
├── INSTRUCTIONS.md           ← you are here
├── README.md                 ← public-facing readme for the repo
├── docs/
│   ├── architecture.md       ← target architecture
│   ├── scraper-notes.md      ← everything we learned about scraping Play Cricket
│   ├── data-schema.md        ← shape of the data files
│   └── scoring-rules.md      ← cricket rules + fantasy scoring spec
├── web/
│   ├── sunbury_stats.html    ← current Sunbury dashboard (reference impl)
│   └── roegreen_stats.html   ← current Roe Green dashboard
├── scraper/
│   └── capture.js            ← the JavaScript we ran in-browser to capture data
└── data/
    ├── sunbury/
    │   └── dashboard_data.json  ← Sunbury's current data snapshot
    └── roegreen/
        └── dashboard_data.json  ← Roe Green's current data snapshot
```

The HTML files are self-contained: open them in a browser, they work.
The data is baked in as `const DATA = { ... }` at the top of the inline script.

---

## 3. Recommended architecture

```
┌────────────────────────────────────────────────────┐
│  GitHub Actions (cron: every Sunday 22:00 UK)      │
│  Runs scraper/capture.ts via Playwright            │
│  → Logs into each club's Play Cricket              │
│  → Pulls Statistics + scorecards                   │
│  → Writes /data/<club>/dashboard_data.json         │
│  → Commits + pushes                                │
└────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────┐
│  Vercel deploy hook                                │
│  → Rebuilds Astro site                             │
│  → Each club has a static page generated from      │
│    /data/<club>/dashboard_data.json                │
│  → Deployed to:                                    │
│      • clubstats.uk            (marketing site)    │
│      • clubstats.uk/sunbury    (Sunbury dashboard) │
│      • clubstats.uk/roegreen   (Roe Green)         │
└────────────────────────────────────────────────────┘
```

### Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** | Static-first, perfect for per-club pages, but supports SSR if needed later |
| Language | **TypeScript** | Self-documenting, fewer runtime bugs |
| Styling | **Tailwind CSS** | The current HTML uses bespoke CSS — port to Tailwind during migration |
| Components | **React** (`astro/react` integration) | Reuse for any interactive bits (filters, leaderboard) |
| Scraper | **Playwright (TypeScript)** | Handles auth + JS-rendered pages reliably |
| Scheduling | **GitHub Actions cron** | Free, version-controlled, easy to monitor |
| Hosting | **Vercel** | Free tier, GitHub integration, custom domains, deploy hooks |
| Domain | **clubstats.uk** | Buy via Namecheap or similar |
| Secrets | **GitHub Actions secrets + Vercel env vars** | Never check credentials into the repo |

---

## 4. Migration plan — phased

### Phase 0 — Repo skeleton (½ day)
- `git init`, push to a GitHub repo (private)
- `npm create astro@latest .` with TypeScript + Tailwind + React
- Wire up Vercel: GitHub integration → auto-deploy main branch
- Get a placeholder page on `<random>.vercel.app`
- Buy `clubstats.uk`, point at Vercel

### Phase 1 — Port the dashboard (1–2 days)
- Convert `web/sunbury_stats.html` to Astro components:
  - `src/layouts/DashboardLayout.astro` (head, fonts, base styles)
  - `src/components/dashboard/Filters.tsx` (season chips, team chips, GT chips, slider)
  - `src/components/dashboard/Kpis.tsx`
  - `src/components/dashboard/Leaderboard.tsx` (with the expand-row, fire emoji, form pills)
  - `src/components/dashboard/RecentMatches.tsx`
  - `src/components/dashboard/Milestones.tsx`
  - `src/components/dashboard/TeamBreakdown.tsx`
  - `src/components/dashboard/SeasonTrend.tsx`
- Convert bespoke CSS to Tailwind. Keep the navy/gold palette as design tokens in `tailwind.config.ts`
- Generate one page per club:
  ```astro
  // src/pages/[club].astro
  export async function getStaticPaths() {
    const clubs = ['sunbury', 'roegreen'];
    return clubs.map(slug => ({ params: { club: slug }, props: { data: loadData(slug) } }));
  }
  ```
- Each club's `dashboard_data.json` lives in `/data/<club>/dashboard_data.json`
- Verify: `clubstats.uk/sunbury` renders identically to the prototype

### Phase 2 — Build the scraper (2–3 days)
- `scraper/capture.ts` using Playwright
- Reads a config: `scraper/clubs.config.ts` with each club's `playCricketSubdomain`, `teamIds`, `enabledSeasons`, etc.
- For each club:
  1. Launch Chromium, log in to `<subdomain>.play-cricket.com` using stored creds
  2. For each season × team × game type, fetch Statistics page, parse the leaderboard tables
  3. For each season, fetch Top Performance pages, parse top innings/spells
  4. Optionally: fetch individual scorecards (`/website/results/<id>`) for true per-innings data — see `docs/scraper-notes.md`
  5. Write JSON to `data/<club>/dashboard_data.json`
- See `scraper/capture.js` (current in-browser version) — port the parsing logic directly to TS

### Phase 3 — Schedule + automate (½ day)
- `.github/workflows/refresh.yml` — runs every Sunday night
  ```yaml
  on:
    schedule: [{ cron: '0 22 * * 0' }]   # 22:00 UTC Sunday
    workflow_dispatch: {}                # manual trigger button
  jobs:
    refresh:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
        - run: npm ci && npx playwright install --with-deps
        - run: npm run scrape   # uses scraper/capture.ts
          env:
            PC_SUNBURY_EMAIL: ${{ secrets.PC_SUNBURY_EMAIL }}
            PC_SUNBURY_PASS:  ${{ secrets.PC_SUNBURY_PASS }}
        - uses: stefanzweifel/git-auto-commit-action@v5
          with: { commit_message: 'data: weekly refresh' }
  ```
- Vercel auto-deploys on the new commit; live site updates within ~2 minutes

### Phase 4 — Marketing site (1 day)
- Port `web/clubstats_landing.html` to a proper `/` page
- Add a contact form (Tally or Formspree) instead of mailto
- Wire up a Stripe Payment Link for the £199 / £99 tier

### Phase 5 — New club onboarding flow (2–3 days, can wait)
- Admin route (`/admin/onboarding`, password-protected) where you add a new club:
  - Slug, full club name, Play Cricket subdomain, brand colours, logo upload
  - Capture credentials securely (stored in Vercel env vars or 1Password CLI)
- On commit, GitHub Action runs the scraper for the new club and adds them to the rotation

---

## 5. Where the dragons are

### Play Cricket authentication
The Statistics page sits behind login. The scraper must log in fresh each run.
We've seen no MFA on Play Cricket so a simple email+password Playwright login
works. Each club needs its own credentials. Store in GitHub Secrets as
`PC_<CLUB>_EMAIL` and `PC_<CLUB>_PASS`.

### Output blocking / "blocked: query string"
While developing in the in-browser capture, the Chrome MCP intermittently blocked
responses that contained URLs or cookie-like strings. In Playwright running on
GitHub Actions this is not an issue. Just be aware that the in-browser version
sometimes needed contortions.

### Rate limiting
The scraper currently runs all fetches in parallel batches of 10. Play Cricket
hasn't pushed back yet but be ready to add `await sleep(500)` between requests
if it ever does. Set a `User-Agent` that identifies the project.

### Scorecard data is the unlock
The current prototype uses **Top Performance lists** as a proxy for "last 5
innings" because the Statistics aggregate page only exposes per-season totals.
True per-innings detail (and the basis for fantasy scoring, player profiles,
awards engine) requires scraping individual scorecards at
`/website/results/<id>`. We've proved this works — see `docs/scraper-notes.md`.

### Premium product = scorecard layer
ClubStats Pro / fantasy / player profiles all depend on the scorecard layer.
Get this in place during Phase 2 even if Phase 1 doesn't use it yet.

### XSS in club content
Club names, opposition names etc. come from Play Cricket. Treat as untrusted.
The current prototype uses `innerHTML` in places — switch to safe React
rendering, never trust strings.

---

## 6. Quality bar

- TypeScript strict mode on
- ESLint + Prettier configured, run on every commit
- Each component has unit tests (Vitest) — at minimum the data-combination
  functions (multi-season combine, multi-team combine, derived avg/SR)
- Visual regression: a Playwright test that loads the Sunbury page and asserts
  Hugh Weibgen's row is at the top with 773 runs
- Lighthouse score >= 95 on all axes (the prototype is close already)
- Works on iPhone SE width (375px)

---

## 7. Style guide

Keep the visual identity that's already in the prototype:
- Navy `#0B4169` + gold `#F2C94C` for ClubStats / Sunbury
- Per-club override (Roe Green: green + black; future clubs configurable)
- Inter / system sans serif throughout
- Bold, sportscaster headlines; tabular numeric font for stats
- Mobile-first; the prototype already responds well

Each club has a small theme object:
```ts
type ClubTheme = {
  primary: string;        // hex
  primaryDark: string;
  accent: string;
  crestSvg?: string;      // optional inline SVG
};
```

---

## 8. The first PR to ship

To prove the migration works, the first PR should:

1. Set up the Astro project skeleton (Phase 0)
2. Port the Sunbury dashboard exactly (Phase 1) — pixel-equivalent
3. Deploy to a `<random>.vercel.app`
4. Pass: `npm test` + `npm run lint` + `npm run build`
5. README updated

Don't try to do everything in one PR — phases 2–5 each get their own.

---

## 9. Reading order if you're a human or an AI agent picking this up cold

1. This file (you just read it)
2. `web/sunbury_stats.html` — open in a browser, click around, understand what
   it does
3. `data/sunbury/dashboard_data.json` — understand the data shape
4. `docs/data-schema.md` — formal description of the schema
5. `docs/scraper-notes.md` — everything we learned about Play Cricket
6. `docs/architecture.md` — target architecture in more depth
7. `scraper/capture.js` — the current scraping logic

Then start with Phase 0.

---

## 10. Contact

- Project owner: Olly Kenton (`olly@kentonconsulting.co.uk` — placeholder)
- Source club: Sunbury CC
- Built with: Claude (Anthropic)
- Original prototype: May 2026
