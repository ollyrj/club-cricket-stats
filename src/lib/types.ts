export type DashboardData = {
  schemaVersion?: number;
  seasons: string[];
  gameTypes: ("League" | "Cup" | "Friendly" | "All")[];
  teams: string[];
  cols: readonly [
    "rank",
    "player",
    "games",
    "inns",
    "no",
    "runs",
    "hs",
    "avg",
    "fifties",
    "hundreds",
    "sr",
  ];
  bowlCols: readonly [
    "rank",
    "player",
    "overs",
    "maidens",
    "runs",
    "wickets",
    "best",
    "fiveW",
    "econ",
    "sr",
    "avg",
  ];

  data: {
    [season: string]: {
      bat: ByGameType<BatRow>;
      tp: ByGameType<TopBat>;
      bowl: ByGameType<BowlRow>;
      bowlTp: ByGameType<TopBowl>;
    };
  };

  playerPerfs: {
    batting: { [playerName: string]: PerfEntry[] };
    bowling: { [playerName: string]: PerfEntry[] };
  };

  meta: {
    club: string;
    source: string;
    capturedAt: string;
    rules: string;
    category: string;
  };
};

export type ByGameType<T> = {
  [gt in "League" | "Cup" | "Friendly" | "All"]?: {
    [team: string]: T[];
  };
};

export type BatRow = [
  rank: number,
  player: string,
  games: number,
  inns: number,
  notOuts: number,
  runs: number,
  hs: string,
  avg: number,
  fifties: number,
  hundreds: number,
  sr: number,
];

export type BowlRow = [
  rank: number,
  player: string,
  overs: number,
  maidens: number,
  runs: number,
  wickets: number,
  best: string,
  fiveW: number,
  econ: number,
  sr: number,
  avg: number,
];

export type TopBat = [
  score: string,
  player: string,
  match: string,
  date: string,
];

export type TopBowl = [
  figures: string,
  player: string,
  match: string,
  date: string,
];

export type PerfEntry = {
  date: string;
  dateLabel: string;
  team: string;
  season: string;
  gt: "League" | "Cup" | "Friendly";
  score: string;
  opposition: string;
};

export type ClubTheme = {
  primary: string;
  primaryDark: string;
  accent: string;
  crestSvg?: string;
};
