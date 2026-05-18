import type {
  FilterState,
  CombinedBatRow,
  CombinedBowlRow,
  TopBatEntry,
  TopBowlEntry,
} from "../../lib/data-utils";

type Props = {
  mode: "batting" | "bowling";
  batRows: CombinedBatRow[];
  bowlRows: CombinedBowlRow[];
  topBat: TopBatEntry[];
  topBowl: TopBowlEntry[];
  state: FilterState;
};

export function KpiGrid({
  mode,
  batRows,
  bowlRows,
  topBat,
  topBowl,
  state,
}: Props) {
  const subSeasons =
    state.seasons.length > 1
      ? `${state.seasons.length} seasons`
      : state.seasons[0];

  if (mode === "batting") {
    const totalRuns = batRows.reduce((s, r) => s + r.runs, 0);
    const topRunner = batRows[0];
    const highestInn = topBat[0];
    const cent = batRows
      .filter((r) => r.hundreds > 0)
      .sort((a, b) => b.hundreds - a.hundreds)[0];
    const fifRows = batRows
      .filter((r) => r.fifties + r.hundreds > 0)
      .sort((a, b) => b.fifties + b.hundreds - (a.fifties + a.hundreds))[0];
    const fiftyTotal = fifRows ? fifRows.fifties + fifRows.hundreds : 0;

    return (
      <div className="kpis">
        <Kpi
          label="Total Runs"
          value={totalRuns.toLocaleString()}
          sub={`${batRows.length} players · ${subSeasons}`}
        />
        <Kpi
          label="Top Run Scorer"
          value={topRunner?.runs.toLocaleString() ?? "0"}
          name={topRunner?.player}
          variant="gold"
        />
        <Kpi
          label="Highest Innings"
          value={highestInn?.score ?? "—"}
          name={highestInn ? `${highestInn.player}` : undefined}
          badge={highestInn?.season}
          variant="gold"
        />
        <Kpi
          label="Most Centuries"
          value={String(cent?.hundreds ?? 0)}
          name={cent?.player}
        />
        <Kpi
          label="Most 50+ Scores"
          value={String(fiftyTotal)}
          name={fifRows?.player}
        />
      </div>
    );
  }

  const totalWkts = bowlRows.reduce((s, r) => s + r.wickets, 0);
  const top = bowlRows[0];
  const bestSpell = topBowl[0];
  const fiveFer = bowlRows
    .filter((r) => r.fiveW > 0)
    .sort((a, b) => b.fiveW - a.fiveW)[0];
  const qualEcon = bowlRows
    .filter((r) => r.overs >= state.minQual && r.econ > 0)
    .sort((a, b) => a.econ - b.econ)[0];

  return (
    <div className="kpis">
      <Kpi
        label="Total Wickets"
        value={String(totalWkts)}
        sub={`${bowlRows.length} bowlers · ${subSeasons}`}
        variant="green"
      />
      <Kpi
        label="Top Wicket Taker"
        value={String(top?.wickets ?? 0)}
        name={top?.player}
        variant="gold"
      />
      <Kpi
        label="Best Spell"
        value={bestSpell?.figures ?? "—"}
        name={bestSpell?.player}
        badge={bestSpell?.season}
        variant="gold"
      />
      <Kpi
        label="Most 5-Wkt Hauls"
        value={String(fiveFer?.fiveW ?? 0)}
        name={fiveFer?.player}
        variant="green"
      />
      <Kpi
        label="Best Economy (qual.)"
        value={qualEcon ? qualEcon.econ.toFixed(2) : "—"}
        name={qualEcon?.player}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  name,
  variant,
  badge,
}: {
  label: string;
  value: string;
  sub?: string;
  name?: string;
  variant?: "gold" | "green";
  badge?: string;
}) {
  return (
    <div className={`kpi${variant ? ` ${variant}` : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
      {name && (
        <div className="name">
          {name}
          {badge && <span className="yr-bdg">{badge}</span>}
        </div>
      )}
    </div>
  );
}
