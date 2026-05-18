import type {
  DashboardData,
  BatRow,
  BowlRow,
  TopBat,
  TopBowl,
  PerfEntry,
} from "./types";

export const BAT_IDX = {
  rank: 0,
  player: 1,
  games: 2,
  inns: 3,
  no: 4,
  runs: 5,
  hs: 6,
  avg: 7,
  fifties: 8,
  hundreds: 9,
  sr: 10,
} as const;

export const BOWL_IDX = {
  rank: 0,
  player: 1,
  overs: 2,
  maidens: 3,
  runs: 4,
  wickets: 5,
  best: 6,
  fiveW: 7,
  econ: 8,
  sr: 9,
  avg: 10,
} as const;

// --- Parsing helpers ---

export function parseHS(s: string | number): number {
  if (typeof s === "number") return s;
  if (!s) return 0;
  return parseInt(String(s).replace(/\D/g, "")) || 0;
}

export function parseBest(s: string | undefined): { w: number; r: number } {
  if (!s) return { w: 0, r: Infinity };
  const m = String(s).match(/^(\d+)\s*\/\s*(\d+)/);
  if (!m) return { w: 0, r: Infinity };
  return { w: +m[1], r: +m[2] };
}

export function oversToBalls(o: number): number {
  if (!o) return 0;
  const whole = Math.floor(o);
  const balls = Math.round((o - whole) * 10);
  return whole * 6 + balls;
}

export function ballsToOvers(b: number): number {
  if (!b) return 0;
  const whole = Math.floor(b / 6);
  const rem = b % 6;
  return +(whole + rem / 10).toFixed(1);
}

export function bestStr(b: { w: number; r: number }): string {
  return b.r === Infinity ? "—" : `${b.w}/${b.r}`;
}

export function compareBest(
  a: { w: number; r: number },
  b: { w: number; r: number },
): number {
  if (a.w !== b.w) return b.w - a.w;
  return a.r - b.r;
}

// --- Combined row types ---

export type CombinedBatRow = {
  rank: number;
  player: string;
  games: number;
  inns: number;
  no: number;
  runs: number;
  hsNum: number;
  hsRaw: string;
  fifties: number;
  hundreds: number;
  balls: number;
  avg: number;
  sr: number;
  seasons: string[];
};

export type CombinedBowlRow = {
  rank: number;
  player: string;
  balls: number;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  fiveW: number;
  bestObj: { w: number; r: number };
  bestStr: string;
  econ: number;
  avg: number;
  sr: number;
  seasons: string[];
};

export type TopBatEntry = {
  score: string;
  scoreN: number;
  player: string;
  match: string;
  date: string;
  season: string;
};

export type TopBowlEntry = {
  figures: string;
  best: { w: number; r: number };
  player: string;
  match: string;
  date: string;
  season: string;
};

// --- Combine functions ---

export function combineBatting(
  seasonRows: Record<string, BatRow[]>,
): CombinedBatRow[] {
  const byPlayer = new Map<string, CombinedBatRow>();
  for (const [season, rows] of Object.entries(seasonRows)) {
    for (const r of rows) {
      const name = r[BAT_IDX.player];
      let a = byPlayer.get(name);
      if (!a) {
        a = {
          rank: 0,
          player: name,
          games: 0,
          inns: 0,
          no: 0,
          runs: 0,
          hsNum: 0,
          hsRaw: "0",
          fifties: 0,
          hundreds: 0,
          balls: 0,
          avg: 0,
          sr: 0,
          seasons: [],
        };
        byPlayer.set(name, a);
      }
      a.games += r[BAT_IDX.games] || 0;
      a.inns += r[BAT_IDX.inns] || 0;
      a.no += r[BAT_IDX.no] || 0;
      a.runs += r[BAT_IDX.runs] || 0;
      const hsN = parseHS(r[BAT_IDX.hs]);
      if (hsN > a.hsNum) {
        a.hsNum = hsN;
        a.hsRaw = String(r[BAT_IDX.hs] ?? "");
      }
      a.fifties += r[BAT_IDX.fifties] || 0;
      a.hundreds += r[BAT_IDX.hundreds] || 0;
      const sr = r[BAT_IDX.sr] || 0;
      const runs = r[BAT_IDX.runs] || 0;
      if (sr > 0 && runs > 0) a.balls += (runs * 100) / sr;
      const s = season.split("|")[0];
      if (!a.seasons.includes(s)) a.seasons.push(s);
    }
  }
  const out = Array.from(byPlayer.values());
  for (const a of out) {
    const outs = a.inns - a.no;
    a.avg = outs > 0 ? +(a.runs / outs).toFixed(2) : 0;
    a.sr = a.balls > 0 ? +((a.runs * 100) / a.balls).toFixed(2) : 0;
  }
  out.sort((x, y) => y.runs - x.runs);
  out.forEach((p, i) => (p.rank = i + 1));
  return out;
}

export function combineBowling(
  seasonRows: Record<string, BowlRow[]>,
): CombinedBowlRow[] {
  const byPlayer = new Map<string, CombinedBowlRow>();
  for (const [season, rows] of Object.entries(seasonRows)) {
    for (const r of rows) {
      const name = r[BOWL_IDX.player];
      let a = byPlayer.get(name);
      if (!a) {
        a = {
          rank: 0,
          player: name,
          balls: 0,
          overs: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          fiveW: 0,
          bestObj: { w: 0, r: Infinity },
          bestStr: "—",
          econ: 0,
          avg: 0,
          sr: 0,
          seasons: [],
        };
        byPlayer.set(name, a);
      }
      a.balls += oversToBalls(r[BOWL_IDX.overs] || 0);
      a.maidens += r[BOWL_IDX.maidens] || 0;
      a.runs += r[BOWL_IDX.runs] || 0;
      a.wickets += r[BOWL_IDX.wickets] || 0;
      a.fiveW += r[BOWL_IDX.fiveW] || 0;
      const b = parseBest(r[BOWL_IDX.best] as string);
      if (compareBest(b, a.bestObj) < 0) {
        a.bestObj = b;
        a.bestStr = bestStr(b);
      }
      const s = season.split("|")[0];
      if (!a.seasons.includes(s)) a.seasons.push(s);
    }
  }
  const out = Array.from(byPlayer.values());
  for (const a of out) {
    a.overs = ballsToOvers(a.balls);
    a.econ = a.balls > 0 ? +((a.runs / a.balls) * 6).toFixed(2) : 0;
    a.avg = a.wickets > 0 ? +(a.runs / a.wickets).toFixed(2) : 0;
    a.sr = a.wickets > 0 ? +(a.balls / a.wickets).toFixed(2) : 0;
  }
  out.sort(
    (x, y) => y.wickets - x.wickets || compareBest(x.bestObj, y.bestObj),
  );
  out.forEach((p, i) => (p.rank = i + 1));
  return out;
}

export function combineTopBatting(
  seasonInn: Record<string, TopBat[]>,
): TopBatEntry[] {
  const all: TopBatEntry[] = [];
  for (const [season, rows] of Object.entries(seasonInn)) {
    for (const r of rows)
      all.push({
        score: r[0],
        scoreN: parseHS(r[0]),
        player: r[1],
        match: r[2],
        date: r[3],
        season,
      });
  }
  all.sort((x, y) => y.scoreN - x.scoreN);
  return all.slice(0, 20);
}

export function combineTopBowling(
  seasonInn: Record<string, TopBowl[]>,
): TopBowlEntry[] {
  const all: TopBowlEntry[] = [];
  for (const [season, rows] of Object.entries(seasonInn)) {
    for (const r of rows) {
      const b = parseBest(r[0]);
      all.push({
        figures: r[0],
        best: b,
        player: r[1],
        match: r[2],
        date: r[3],
        season,
      });
    }
  }
  all.sort((x, y) => compareBest(x.best, y.best));
  return all.slice(0, 20);
}

// --- State-filtered getters ---

export type FilterState = {
  mode: "batting" | "bowling";
  seasons: string[];
  teams: string[];
  gt: string;
  minQual: number;
  sortKey: string;
  sortDir: -1 | 1;
};

export function getCurrentBatting(
  data: DashboardData,
  state: FilterState,
): CombinedBatRow[] {
  const seasonRows: Record<string, BatRow[]> = {};
  for (const s of state.seasons) {
    for (const t of state.teams) {
      seasonRows[s + "|" + t] = data.data[s]?.bat[state.gt]?.[t] || [];
    }
  }
  return combineBatting(seasonRows);
}

export function getCurrentBowling(
  data: DashboardData,
  state: FilterState,
): CombinedBowlRow[] {
  const seasonRows: Record<string, BowlRow[]> = {};
  for (const s of state.seasons) {
    for (const t of state.teams) {
      seasonRows[s + "|" + t] = data.data[s]?.bowl?.[state.gt]?.[t] || [];
    }
  }
  return combineBowling(seasonRows);
}

export function getCurrentTopBat(
  data: DashboardData,
  state: FilterState,
): TopBatEntry[] {
  const seasonInn: Record<string, TopBat[]> = {};
  const seen = new Set<string>();
  for (const s of state.seasons) {
    for (const t of state.teams) {
      const rows = data.data[s]?.tp[state.gt]?.[t] || [];
      if (!seasonInn[s]) seasonInn[s] = [];
      for (const r of rows) {
        const k = s + "|" + r[3] + "|" + r[1] + "|" + r[0];
        if (seen.has(k)) continue;
        seen.add(k);
        seasonInn[s].push(r);
      }
    }
  }
  return combineTopBatting(seasonInn);
}

export function getCurrentTopBowl(
  data: DashboardData,
  state: FilterState,
): TopBowlEntry[] {
  const seasonInn: Record<string, TopBowl[]> = {};
  const seen = new Set<string>();
  for (const s of state.seasons) {
    for (const t of state.teams) {
      const rows = data.data[s]?.bowlTp?.[state.gt]?.[t] || [];
      if (!seasonInn[s]) seasonInn[s] = [];
      for (const r of rows) {
        const k = s + "|" + r[3] + "|" + r[1] + "|" + r[0];
        if (seen.has(k)) continue;
        seen.add(k);
        seasonInn[s].push(r);
      }
    }
  }
  return combineTopBowling(seasonInn);
}

// --- Form helpers ---

export function getPlayerForm(
  data: DashboardData,
  playerName: string,
  mode: "batting" | "bowling",
  state: FilterState,
): PerfEntry[] {
  const perfs = (data.playerPerfs?.[mode] || {})[playerName] || [];
  const filtered = perfs.filter((p) => state.seasons.includes(p.season));
  const gtFiltered =
    state.gt === "All" ? filtered : filtered.filter((p) => p.gt === state.gt);
  return gtFiltered.slice(0, 5);
}

export function isInForm(
  rows: PerfEntry[],
  mode: "batting" | "bowling",
): boolean {
  if (!rows.length) return false;
  if (mode === "batting") {
    const fiftyPlus = rows.filter(
      (p) => parseInt(String(p.score).replace(/\D/g, "")) >= 50,
    ).length;
    return (
      fiftyPlus >= 2 ||
      rows.some((p) => parseInt(String(p.score).replace(/\D/g, "")) >= 100)
    );
  } else {
    const goodSpells = rows.filter((p) => {
      const m = String(p.score).match(/^(\d+)\s*\/\s*\d+/);
      return m && parseInt(m[1]) >= 3;
    }).length;
    return goodSpells >= 1;
  }
}

export function teamTagClass(team: string): string {
  const map: Record<string, string> = {
    "1st XI": "t1",
    "2nd XI": "t2",
    "3rd XI": "t3",
    "4th XI": "t4",
    "5th XI": "t5",
    "6th XI": "t6",
  };
  return map[team] || "t6";
}

// --- Header definitions ---

export type HeaderDef = {
  key: string;
  label: string;
  cls?: string;
  def: 1 | -1;
  strong?: boolean;
  display?: (r: CombinedBatRow | CombinedBowlRow) => string;
  qual?: boolean;
  custom?: string;
};

export const BAT_HEADERS: HeaderDef[] = [
  { key: "rank", label: "POS", def: 1 },
  { key: "player", label: "Player", cls: "player-col", def: 1 },
  { key: "games", label: "M", def: -1 },
  { key: "inns", label: "I", def: -1 },
  { key: "no", label: "NO", def: -1 },
  { key: "runs", label: "Runs", def: -1, strong: true },
  {
    key: "hsNum",
    label: "HS",
    def: -1,
    display: (r) => (r as CombinedBatRow).hsRaw,
  },
  { key: "avg", label: "Avg", def: -1, qual: true },
  { key: "fifties", label: "50s", def: -1 },
  { key: "hundreds", label: "100s", def: -1 },
  { key: "sr", label: "SR", def: -1, qual: true },
];

export const BOWL_HEADERS: HeaderDef[] = [
  { key: "rank", label: "POS", def: 1 },
  { key: "player", label: "Player", cls: "player-col", def: 1 },
  { key: "overs", label: "O", def: -1 },
  { key: "maidens", label: "M", def: -1 },
  { key: "runs", label: "R", def: -1 },
  { key: "wickets", label: "W", def: -1, strong: true },
  { key: "bestStr", label: "Best", def: -1, custom: "best" },
  { key: "fiveW", label: "5W", def: -1 },
  { key: "econ", label: "Econ", def: 1, qual: true },
  { key: "sr", label: "SR", def: 1, qual: true },
  { key: "avg", label: "Avg", def: 1, qual: true },
];

// --- Recent games ---

export type RecentMatch = {
  date: string;
  dateLabel: string;
  team: string;
  opposition: string;
  gt: string;
  perfs: (PerfEntry & { player: string })[];
};

export function getRecentGames(
  data: DashboardData,
  state: FilterState,
): RecentMatch[] {
  const mode = state.mode;
  const perfMap = data.playerPerfs?.[mode] || {};
  const all: (PerfEntry & { player: string })[] = [];
  for (const [player, list] of Object.entries(perfMap)) {
    for (const p of list) {
      if (!state.seasons.includes(p.season)) continue;
      if (state.gt !== "All" && p.gt !== state.gt) continue;
      if (!state.teams.includes("All") && !state.teams.includes(p.team))
        continue;
      all.push({ ...p, player });
    }
  }
  const byKey = new Map<string, RecentMatch>();
  for (const p of all) {
    const k = p.date + "|" + p.team;
    if (!byKey.has(k))
      byKey.set(k, {
        date: p.date,
        dateLabel: p.dateLabel,
        team: p.team,
        opposition: p.opposition,
        gt: p.gt,
        perfs: [],
      });
    byKey.get(k)!.perfs.push(p);
  }
  return Array.from(byKey.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
}
