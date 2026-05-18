# Data Schema

Each club has a single `dashboard_data.json` file. The schema below is what
the current prototype expects; preserve it during the Astro port to avoid
rewriting the rendering code.

```ts
type DashboardData = {
  seasons:   string[];                          // e.g. ['2023','2024','2025','2026']
  gameTypes: ('League' | 'Cup' | 'Friendly' | 'All')[];
  teams:     string[];                          // ['All','1st XI','2nd XI', ...]
  cols:      ['rank','player','games','inns','no','runs','hs','avg','fifties','hundreds','sr'];
  bowlCols:  ['rank','player','overs','maidens','runs','wickets','best','fiveW','econ','sr','avg'];

  data: {
    [season: string]: {                         // '2023', '2024', etc.
      bat:     ByGameType<BatRow>;
      tp:      ByGameType<TopBat>;
      bowl:    ByGameType<BowlRow>;
      bowlTp:  ByGameType<TopBowl>;
    };
  };

  playerPerfs: {
    batting:  { [playerName: string]: PerfEntry[] };
    bowling:  { [playerName: string]: PerfEntry[] };
  };

  meta: {
    club:        string;                        // 'Sunbury CC'
    source:      string;                        // 'https://sunbury.play-cricket.com/Statistics'
    capturedAt:  string;                        // 'May 2026'
    rules:       string;                        // 'Standard'
    category:    string;                        // 'Senior'
  };
};

type ByGameType<T> = {
  [gt in 'League' | 'Cup' | 'Friendly' | 'All']: {
    [team: string]: T[];                        // 'All' | '1st XI' | '2nd XI' | ...
  };
};

// Compact array representation — the indexes match `cols` / `bowlCols` above.
type BatRow = [
  rank: number, player: string, games: number, inns: number,
  notOuts: number, runs: number, hs: string, avg: number,
  fifties: number, hundreds: number, sr: number
];

type BowlRow = [
  rank: number, player: string, overs: number, maidens: number,
  runs: number, wickets: number, best: string, fiveW: number,
  econ: number, sr: number, avg: number
];

type TopBat   = [score: string, player: string, match: string, date: string];
type TopBowl  = [figures: string, player: string, match: string, date: string];

type PerfEntry = {
  date:        string;     // ISO 'YYYY-MM-DD'
  dateLabel:   string;     // '12 Jul 2025'
  team:        string;     // '1st XI' | '2nd XI' | ...
  season:      string;
  gt:          'League' | 'Cup' | 'Friendly';
  score:       string;     // batting '249' | '100*' | bowling '6/19'
  opposition:  string;     // 'Hampton Wick Royal CC'
};
```

## Why arrays not objects for rows

The `BatRow` / `BowlRow` types use arrays rather than objects for compactness.
Sunbury's full data file is 500KB+ as arrays; it would balloon to ~1.4MB as
objects. The `cols` and `bowlCols` arrays at the top tell you which index is
which.

## Why `playerPerfs` is separate

Top performances are kept as a player-keyed map so the dashboard can look them
up in O(1) when expanding a row. The same performance can appear in the
top-N list of multiple (season, team, game type) tuples; we de-duplicate at
ingest time.

## Schema versioning

Add a `schemaVersion: number` to the root when you port to TypeScript so future
migrations are obvious. Start at `1`.

## Determinism

The scraper should write JSON with sorted keys so commit diffs are minimal:

```ts
JSON.stringify(data, null, 2)  // dev-readable
// or in production: JSON.stringify(data, replacerThatSorts)
```

## Example sizes

| Club        | Seasons | Players (bat × bowl) | File size |
|-------------|---------|----------------------|-----------|
| Sunbury     | 4       | ~160 × ~120          | ~550 KB   |
| Roe Green   | 4       | ~50 × ~30            | ~230 KB   |

After adding scorecard-derived per-innings data, file sizes will roughly
double. Still fine for a static site.
