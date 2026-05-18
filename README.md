# ClubStats

Beautiful, shareable cricket dashboards for UK cricket clubs.

Each club gets:
- A permanent URL (e.g. `clubstats.uk/yourclub`)
- Multi-season + multi-XI batting & bowling leaderboards
- Top performances, form indicators, recent matches
- Weekly auto-refresh during the season
- Sold to clubs as a £199 setup + £99/year service

## Status

Early-stage product, ported from a working prototype. See
[`INSTRUCTIONS.md`](./INSTRUCTIONS.md) for the full handover and migration plan.

Live demos:
- Sunbury CC: https://litter.catbox.moe/fhc96x.html *(temporary)*
- Roe Green CC: https://litter.catbox.moe/1kb578.html *(temporary)*
- Marketing: https://litter.catbox.moe/d9q44d.html *(temporary)*

## Quick start

```bash
git clone <repo>
cd clubstats
npm install
npx playwright install --with-deps
npm run dev
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local Astro dev server |
| `npm run build` | Static build to `dist/` |
| `npm run scrape -- --club=sunbury` | Re-scrape one club |
| `npm run scrape:all` | Re-scrape every club |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint + Prettier check |
| `npm run typecheck` | `tsc --noEmit` |

## Repository layout

```
.
├── INSTRUCTIONS.md         # Full handover & migration plan
├── README.md               # This file
├── docs/                   # Architecture, scraper notes, data schema, scoring
├── src/                    # Astro site source
│   ├── pages/              # Routes (incl. dynamic /[club].astro)
│   ├── components/
│   ├── layouts/
│   └── lib/                # Data combine, form calc, theme helpers
├── scraper/                # Playwright scraping
│   ├── capture.ts
│   └── clubs.config.ts
├── data/                   # Per-club JSON snapshots (committed)
│   └── <club>/
│       └── dashboard_data.json
├── public/                 # Static assets
└── .github/workflows/      # Scheduled refresh action
```

## Adding a new club

1. Add an entry to `scraper/clubs.config.ts`:
   ```ts
   {
     slug: 'newclub',
     name: 'New Cricket Club',
     playCricketSubdomain: 'newclub',
     teamIds: { '1st XI': 12345, '2nd XI': 12346, ... },
     enabledSeasons: ['2023', '2024', '2025', '2026'],
     theme: { primary: '#1e6a47', accent: '#FFD700' },
   }
   ```
2. Add credentials to GitHub Secrets:
   - `PC_NEWCLUB_EMAIL`
   - `PC_NEWCLUB_PASS`
3. Trigger the GitHub Action manually (`workflow_dispatch`)
4. Wait for the auto-commit + Vercel rebuild
5. Live at `clubstats.uk/newclub`

## License

All rights reserved.
