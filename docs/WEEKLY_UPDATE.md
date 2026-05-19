# Weekly Stats Update — How It Works

## Overview

Every Sunday night during the season, we re-scrape the current season's stats from Play Cricket and redeploy. The whole process takes about 2 minutes.

**You do NOT need to have Play Cricket open in your browser.** The scraper launches its own headless browser, logs in, fetches the stats pages, and writes the updated JSON.

---

## Prerequisites (one-time setup)

1. **Install Playwright's browser:**

   ```bash
   npx playwright install chromium
   ```

2. **Set Play Cricket credentials as environment variables.** For each club, set:

   ```bash
   export PC_SUNBURY_EMAIL="the-login-email@example.com"
   export PC_SUNBURY_PASS="the-password"

   export PC_ROEGREEN_EMAIL="..."
   export PC_ROEGREEN_PASS="..."
   ```

   The naming convention is `PC_<SLUG>_EMAIL` and `PC_<SLUG>_PASS` where `<SLUG>` is the club slug in UPPERCASE (matching `scraper/clubs.config.ts`).

   **Tip:** Add these to a `.env` file (gitignored) and source it before running:

   ```bash
   source .env
   ```

---

## Weekly Update (current season only)

This is the command you run each week. It only scrapes the 2026 season and merges it into the existing data file, keeping all historical seasons intact.

```bash
# 1. Scrape current season for all clubs
npm run scrape:weekly

# 2. Build the site
npm run build

# 3. Deploy
sshpass -p 'suyC]E(MeC?q' rsync -avz --delete \
  -e 'ssh -p 2223 -o StrictHostKeyChecking=no' \
  dist/ clubcricketstats@176.74.18.125:site/public_html/
```

Or for a single club:

```bash
npm run scrape -- --club=sunbury --season=2026
```

### What happens under the hood

1. The scraper launches a headless Chromium browser
2. Logs into `sunbury.play-cricket.com` using the env var credentials
3. Fetches ~112 stats pages for the 2026 season (all teams x game types x bat/bowl/top)
4. Merges the fresh 2026 data into the existing `data/sunbury/dashboard_data.json`
5. Rebuilds `playerPerfs` across ALL seasons (so cross-season records stay correct)
6. Writes the updated JSON file

---

## Full Scrape (all seasons — initial setup or rebuild)

When onboarding a new club or if you need to rebuild from scratch:

```bash
# Single club, all seasons
npm run scrape -- --club=sunbury

# All clubs, all seasons
npm run scrape:all
```

This scrapes every season in `enabledSeasons` (currently 2023-2026) and writes a complete `dashboard_data.json` from scratch.

---

## Adding a New Club

1. Get the club's Play Cricket subdomain (the bit before `.play-cricket.com`)
2. Find their team IDs from the Play Cricket Statistics page URL params
3. Add the club config to `scraper/clubs.config.ts`
4. Add their theme to `src/lib/themes.ts`
5. Set their env vars: `PC_<SLUG>_EMAIL` and `PC_<SLUG>_PASS`
6. Run a full scrape: `npm run scrape -- --club=<slug>`
7. Build and deploy

---

## Updating the Season ID

At the start of each new Play Cricket season, a new season ID is assigned. Check the Play Cricket Statistics page URL for the new `season=` parameter value and add it to `scraper/urls.ts` in the `SEASON_IDS` map.

Also update the `scrape:weekly` script in `package.json` to use the new year.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing credentials` error | Set `PC_<SLUG>_EMAIL` and `PC_<SLUG>_PASS` env vars |
| Login fails | Check credentials are correct; Play Cricket may have changed their login form |
| `Error budget exceeded` | >5% of fetches failed. Check network, Play Cricket may be down |
| Empty data for a team | Team ID may have changed — check Play Cricket and update `clubs.config.ts` |
| `Unknown season` warning | Add the new season ID to `scraper/urls.ts` |

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `npm run scrape:weekly` | Scrape 2026 only, all clubs, merge into existing data |
| `npm run scrape -- --club=sunbury --season=2026` | Scrape 2026, Sunbury only |
| `npm run scrape -- --club=sunbury` | Full scrape, all seasons, Sunbury |
| `npm run scrape:all` | Full scrape, all seasons, all clubs |
