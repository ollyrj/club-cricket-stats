import type { DashboardData } from "../../lib/types";
import type {
  FilterState,
  CombinedBatRow,
  CombinedBowlRow,
} from "../../lib/data-utils";
import { BAT_IDX, BOWL_IDX } from "../../lib/data-utils";

type Props = {
  data: DashboardData;
  state: FilterState;
  mode: "batting" | "bowling";
  combinedRows: (CombinedBatRow | CombinedBowlRow)[];
};

export function SeasonTrend({ data, state, mode, combinedRows }: Props) {
  const top8 = combinedRows.slice(0, 8);
  const seasonsSorted = state.seasons.slice().sort();

  if (top8.length === 0 || seasonsSorted.length < 2) {
    return (
      <>
        <div className="section-h">Per-season trend for top players</div>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ color: "var(--muted)", fontStyle: "italic" }}>
            {seasonsSorted.length < 2
              ? "Select 2+ seasons to see year-by-year trend."
              : "No data."}
          </div>
        </div>
      </>
    );
  }

  const getVal = (player: string, season: string): number => {
    let total = 0;
    for (const t of state.teams) {
      if (mode === "batting") {
        const rows = data.data[season]?.bat[state.gt]?.[t] || [];
        const r = rows.find((r) => r[BAT_IDX.player] === player);
        if (r) total += r[BAT_IDX.runs];
      } else {
        const rows = data.data[season]?.bowl?.[state.gt]?.[t] || [];
        const r = rows.find((r) => r[BOWL_IDX.player] === player);
        if (r) total += r[BOWL_IDX.wickets];
      }
    }
    return total;
  };

  const maxV = Math.max(
    ...top8.flatMap((p) => seasonsSorted.map((s) => getVal(p.player, s))),
    1,
  );

  const statLabel = mode === "batting" ? "runs" : "wickets";
  const totalKey = mode === "batting" ? "runs" : "wickets";
  const barColor =
    mode === "batting"
      ? "linear-gradient(90deg, var(--navy-l), var(--navy))"
      : "linear-gradient(90deg, #34a374, #1e6a47)";

  return (
    <>
      <div className="section-h">Per-season trend for top players</div>
      <div className="panel" style={{ padding: 18 }}>
        <div
          className="trend-grid"
          style={{
            display: "grid",
            gridTemplateColumns: `180px repeat(${seasonsSorted.length}, 1fr)`,
            gap: "8px 12px",
            alignItems: "center",
            fontSize: 13,
          }}
        >
          <div />
          {seasonsSorted.map((s) => (
            <div key={s} className="trend-header">
              {s}
            </div>
          ))}
          {top8.map((p) => (
            <TrendRow
              key={p.player}
              player={p.player}
              total={(p as unknown as Record<string, number>)[totalKey]}
              statLabel={statLabel}
              seasons={seasonsSorted}
              getVal={getVal}
              maxV={maxV}
              barColor={barColor}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function TrendRow({
  player,
  total,
  statLabel,
  seasons,
  getVal,
  maxV,
  barColor,
}: {
  player: string;
  total: number;
  statLabel: string;
  seasons: string[];
  getVal: (player: string, season: string) => number;
  maxV: number;
  barColor: string;
}) {
  return (
    <>
      <div style={{ fontWeight: 600 }}>
        {player}{" "}
        <span
          style={{
            color: "var(--muted)",
            fontWeight: 400,
            fontSize: "11px",
          }}
        >
          {total} {statLabel}
        </span>
      </div>
      {seasons.map((s) => {
        const v = getVal(player, s);
        const pct = ((v / maxV) * 100).toFixed(0);
        return (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 14,
                background: "#eef2f8",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: barColor,
                }}
              />
            </div>
            <div
              style={{
                minWidth: 36,
                fontSize: "11.5px",
                fontWeight: 700,
                color: "var(--navy)",
                textAlign: "right",
              }}
            >
              {v || "—"}
            </div>
          </div>
        );
      })}
    </>
  );
}
