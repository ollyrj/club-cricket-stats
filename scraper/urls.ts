export const SEASON_IDS: Record<string, string> = {
  "2026": "259",
  "2025": "258",
  "2024": "257",
  "2023": "256",
  "2022": "255",
  "2021": "222",
  "2020": "77",
  "2019": "76",
};

export const GAME_TYPES: [label: string, id: string][] = [
  ["League", "194"],
  ["Cup", "195"],
  ["Friendly", "196"],
  ["All", "all"],
];

export const RULES_STANDARD = "179";
export const CATEGORY_SENIOR = "1";

type StatsUrlParams = {
  subdomain: string;
  tab: "Batting" | "Bowling";
  subTab: "Standard" | "Top%20Performance";
  seasonId: string;
  teamId: string;
  gameType: string;
};

export function buildStatsUrl(params: StatsUrlParams): string {
  const qs = new URLSearchParams({
    tab: params.tab,
    sub_tab: params.subTab,
    per_page: "500",
    rule_type_id: RULES_STANDARD,
    season: params.seasonId,
    order_by: "total_runs",
    category_id: CATEGORY_SENIOR,
    gender_id: "all",
    game_type: params.gameType,
    team_id: params.teamId,
    atleast: "1",
  });
  return `https://${params.subdomain}.play-cricket.com/Statistics?${qs.toString()}`;
}
