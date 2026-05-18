// TODO: Implement Playwright scraper (Phase 2)
//
// This file will:
// 1. Read club config from clubs.config.ts
// 2. Log into each club's Play Cricket site via Playwright
// 3. Scrape Statistics (Batting + Bowling) and Top Performances
// 4. Scrape individual scorecards for per-innings data
// 5. Write data/<club>/dashboard_data.json
//
// See docs/scraper-notes.md for Play Cricket page structure and auth details.
// See scraper/capture.js for the original in-browser prototype.

import type { ClubConfig } from "./clubs.config";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function scrapeClub(_config: ClubConfig): Promise<void> {
  throw new Error("Scraper not yet implemented — see Phase 2");
}
