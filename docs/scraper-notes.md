# Play Cricket Scraper — Notes

Everything we learned about scraping Play Cricket while building the prototype.
Read this before porting the scraper to Playwright.

## Subdomain model

Every club has a Play Cricket subdomain:
- `sunbury.play-cricket.com`
- `roegreen.play-cricket.com`
- etc.

The Statistics page lives at `<subdomain>.play-cricket.com/Statistics` and
requires login to view.

## Authentication

The login form lives at `<subdomain>.play-cricket.com/users/sign_in`. There is
no MFA. A simple Playwright login:

```ts
await page.goto(`https://${sub}.play-cricket.com/users/sign_in`);
await page.fill('input[name="user[email]"]', email);
await page.fill('input[name="user[password]"]', pass);
await page.click('input[type="submit"]');
await page.waitForURL('**/home');
```

Session cookies persist for the lifetime of the Playwright context.

## Statistics page structure

URL pattern:
```
/Statistics?tab=Batting&sub_tab=Standard&per_page=500
  &rule_type_id=179        (Standard rules; 328 = Indoor, 330 = Junior, 180 = Pairs)
  &season=258              (Season ID — see season map below)
  &order_by=total_runs
  &category_id=1           (Senior; 2=Social, 3=Junior, 4=Indoor, 5=Disability)
  &gender_id=all
  &game_type=194           (League; 195=Cup, 196=Friendly, 'all'=combined, 'league_cup'=L+C)
  &team_id=29506           (per-club team ID — see "Discovering team IDs")
  &atleast=1               (min innings filter)
```

### Season ID map (Play Cricket-wide)
```ts
const SEASON_IDS = {
  '2026': '259', '2025': '258', '2024': '257',
  '2023': '256', '2022': '255', '2021': '222',
  '2020': '77',  '2019': '76',  // older mappings extend down
};
```

### Game type IDs (Play Cricket-wide)
```ts
const GAME_TYPE = {
  League: '194', Cup: '195', Friendly: '196',
  'League & Cup': 'league_cup', All: 'all',
};
```

### Category IDs
```ts
const CATEGORY = { Senior: '1', Social: '2', Junior: '3', Indoor: '4', Disability: '5' };
```

## Discovering team IDs

Team IDs are per-club. To get them:

1. Log into `<subdomain>.play-cricket.com/Statistics`
2. Inspect the `<select name="team_id">` dropdown
3. Each `<option value="X">1st XI</option>` gives you `team_id = X`

```ts
// In Playwright
const teamOptions = await page.$$eval('select[name="team_id"] option', opts =>
  opts.map(o => ({ id: o.value, label: o.textContent?.trim() ?? '' }))
);
```

## Sub-tabs

- **Standard** — the aggregate leaderboard table (RUNS, AVG, etc.)
- **Top Performance** — top 20 individual innings/spells with date + scorecard link
- **Partnerships** — partnership-level data (not yet used)

For Batting Standard, parse a table with headers:
```
RANK | PLAYER | GAMES | INNS | NOT OUTS | RUNS | HIGH SCORE | AVG | 50s | 100s | STRIKE RATE
```

For Bowling Standard:
```
RANK | PLAYER | OVERS | MAIDENS | RUNS | WICKETS | BEST BOWLING | 5 WICKET HAUL | ECONOMY RATE | STRIKE RATE | AVERAGE
```

For Top Performance (Batting):
```
SCORE | NAME | MATCH | DATE | Scorecard (link to /website/results/<id>)
```

For Top Performance (Bowling):
```
WICKET (figures like 6/19) | NAME | MATCH | DATE | Scorecard
```

## Player profile pages

URL: `/player_stats/batting/<player_id>?season=<id>&category_id=<id>`

Has per-season aggregates **plus additional columns we don't get from the
leaderboard**: `4s`, `6s`, `DUCKS`, `%TEAM RUNS`.

Worth scraping for the profile pages feature.

## Scorecards — the unlock

URL: `/website/results/<scorecard_id>`

**Crucially, scorecards work without login** (as far as we tested). They're
publicly viewable.

The HTML returned by a plain `fetch()` already contains the rendered scorecard
tables — no JS rendering needed. From Playwright, just `await page.goto(url)`
and parse.

### Scorecard structure

11+ tables per match. The relevant ones:

- **Batting table** (one per innings) — header includes `BATTER`
  - Cell 0: player name (wrapped in `<a>`)
  - Cell 1: dismissal type + fielder
  - Cell 2: bowler
  - Last 5 cells: RUNS, BALLS, 4s, 6s, SR
- **Bowling table** (one per innings) — header includes `BOWLER`
  - Player name in `<a>`
  - OVERS, MAIDENS, RUNS, WICKETS, WIDES, NO BALLS, ECON

A 2-innings match (most amateur cricket) has:
- Batting innings 1, bowling innings 1 (Team A bats, Team B bowls)
- Batting innings 2, bowling innings 2 (Team B bats, Team A bowls)

### Enumerating scorecard IDs

Each season's worth of scorecards can be enumerated by scraping every
**Top Performance** page across all teams × game types and collecting unique
`/website/results/<id>` links. For Sunbury 2025 this gave 106 unique IDs.

```ts
const scorecardIds = new Set<string>();
for (const team of teams) {
  for (const gt of gameTypes) {
    for (const subtab of ['Batting', 'Bowling']) {
      const html = await fetchTopPerformance(team, gt, subtab, season);
      [...html.matchAll(/\/website\/results\/(\d+)/g)].forEach(m =>
        scorecardIds.add(m[1])
      );
    }
  }
}
```

### Team-per-scorecard mapping

The same Top Performance scrape tells you which team played each scorecard:
the URL parameter `team_id=X` plus the resulting scorecard IDs gives you a
`scorecard_id → team` map (a scorecard appears in Top Performance lists for
exactly the team that played it).

### Parsing dates from scorecards

Dates are inconsistent in body text. Most reliable source is the Top
Performance row that contains both the date label and the scorecard link.
Build a `scid → date` map there.

## Match list page (FYI)

`/Matches?...` shows the club's fixture/result calendar. It's heavily
JS-rendered and unreliable to scrape. We worked around it by using Top
Performance as the source of scorecard IDs instead.

## Quirks

- The `q[category_id]` filter sometimes uses `q%5Bcategory_id%5D` URL-encoded
- The `season` parameter can appear twice in the URL — Play Cricket tolerates this
- Some old scorecards have only 1 innings (forfeit / abandoned games)
- The Top Performance list is capped at 20 entries per (season × team × game type)

## Rate-limiting

We made 100+ requests in quick succession during testing without being throttled.
Be polite anyway:

```ts
import pLimit from 'p-limit';
const limit = pLimit(5);  // 5 concurrent requests max
await Promise.all(urls.map(url => limit(() => fetch(url))));
```

Set a meaningful `User-Agent`: `ClubStats-Refresh/1.0 (+https://clubstats.uk/about)`

## Resilience

When you hit a missing field or unexpected HTML, **don't crash**. Log a
warning, skip the row, continue. A single weird scorecard shouldn't break the
whole refresh.

Suggested error budget: if > 5% of fetches fail, send an alert (Slack webhook
or email). Otherwise log and carry on.

## What to scrape on each refresh

```
For each enabled club:
  For each enabled season:
    For each team_id × game_type:
      Fetch Statistics Batting + Bowling (Standard)
      Fetch Statistics Batting + Bowling (Top Performance)
    Diff scorecard IDs vs last run
    For each NEW scorecard_id:
      Fetch /website/results/<id>
      Parse innings into per-player records
    Recompute combined data file
    Write data/<club>/dashboard_data.json
```

Incremental: only fetch new scorecards, not all of them, each run. Drop into
~30 seconds per club after the initial load.
