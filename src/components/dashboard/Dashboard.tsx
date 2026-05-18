import { useState, useMemo, useCallback } from "react";
import type { DashboardData } from "../../lib/types";
import type { ClubTheme } from "../../lib/types";
import type { FilterState } from "../../lib/data-utils";
import {
  getCurrentBatting,
  getCurrentBowling,
  getCurrentTopBat,
  getCurrentTopBowl,
  getRecentGames,
  BAT_HEADERS,
  BOWL_HEADERS,
} from "../../lib/data-utils";
import { Header } from "./Header";
import { FilterPanel } from "./FilterPanel";
import { KpiGrid } from "./KpiGrid";
import { RecentGames } from "./RecentGames";
import { Leaderboard } from "./Leaderboard";
import { TopPerformances } from "./TopPerformances";
import { Milestones } from "./Milestones";
import { TeamBreakdown } from "./TeamBreakdown";
import { SeasonTrend } from "./SeasonTrend";

type Props = {
  data: DashboardData;
  theme: ClubTheme;
};

export function Dashboard({ data, theme }: Props) {
  const [state, setState] = useState<FilterState>({
    mode: "batting",
    seasons: [data.seasons[data.seasons.length - 2] ?? data.seasons[0]],
    teams: ["All"],
    gt: "League",
    minQual: 3,
    sortKey: "runs",
    sortDir: -1,
  });

  const update = useCallback(
    (patch: Partial<FilterState>) => setState((s) => ({ ...s, ...patch })),
    [],
  );

  const switchMode = useCallback((mode: "batting" | "bowling") => {
    setState((s) => ({
      ...s,
      mode,
      sortKey: mode === "batting" ? "runs" : "wickets",
      sortDir: -1,
      minQual: mode === "batting" ? 3 : 12,
    }));
  }, []);

  const batRows = useMemo(() => getCurrentBatting(data, state), [data, state]);
  const bowlRows = useMemo(() => getCurrentBowling(data, state), [data, state]);
  const topBat = useMemo(() => getCurrentTopBat(data, state), [data, state]);
  const topBowl = useMemo(() => getCurrentTopBowl(data, state), [data, state]);
  const recentMatches = useMemo(
    () => getRecentGames(data, state),
    [data, state],
  );

  const rows = state.mode === "batting" ? batRows : bowlRows;
  const headers = state.mode === "batting" ? BAT_HEADERS : BOWL_HEADERS;
  const qualCount =
    state.mode === "batting"
      ? rows.filter((r) => "inns" in r && r.inns >= state.minQual).length
      : rows.filter((r) => "overs" in r && r.overs >= state.minQual).length;

  const cssVars = {
    "--navy": theme.primary,
    "--navy-d": theme.primaryDark,
    "--navy-l": lighten(theme.primary, 20),
    "--gold": "#F2C94C",
    "--gold-d": "#caa334",
    "--green": "#1e8a57",
    "--bg": "#f4f6fa",
    "--card": "#ffffff",
    "--ink": "#0e1d2c",
    "--muted": "#5a6776",
    "--line": "#dfe6ee",
    "--hi": "#fffbea",
  } as React.CSSProperties;

  return (
    <div style={cssVars} className="dashboard">
      <Header
        clubName={data.meta.club}
        mode={state.mode}
        state={state}
        onSwitchMode={switchMode}
        theme={theme}
        crestSvg={theme.crestSvg}
      />
      <div className="container">
        <FilterPanel
          data={data}
          state={state}
          update={update}
          qualCount={qualCount}
        />
        <KpiGrid
          mode={state.mode}
          batRows={batRows}
          bowlRows={bowlRows}
          topBat={topBat}
          topBowl={topBowl}
          state={state}
        />
        <RecentGames matches={recentMatches} mode={state.mode} />
        <div className="main-grid">
          <Leaderboard
            rows={rows}
            headers={headers}
            mode={state.mode}
            state={state}
            data={data}
            update={update}
          />
          <TopPerformances
            mode={state.mode}
            topBat={topBat}
            topBowl={topBowl}
            multiSeason={state.seasons.length > 1}
          />
        </div>
        <Milestones
          mode={state.mode}
          batRows={batRows}
          bowlRows={bowlRows}
          state={state}
        />
        <TeamBreakdown data={data} state={state} mode={state.mode} />
        <SeasonTrend
          data={data}
          state={state}
          mode={state.mode}
          combinedRows={rows}
        />
        <footer className="footer">
          Data source:{" "}
          <a href={data.meta.source} target="_blank" rel="noopener noreferrer">
            {data.meta.source.replace("https://", "")}
          </a>{" "}
          · {data.meta.category} · Rules: {data.meta.rules} · Captured{" "}
          {data.meta.capturedAt}
        </footer>
      </div>
    </div>
  );
}

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + percent);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent);
  const b = Math.min(255, (num & 0xff) + percent);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
