import type { DashboardData } from "../../lib/types";
import type { FilterState } from "../../lib/data-utils";
import { combineBatting, combineBowling } from "../../lib/data-utils";

type Props = {
  data: DashboardData;
  state: FilterState;
  mode: "batting" | "bowling";
};

export function TeamBreakdown({ data, state, mode }: Props) {
  const teams = data.teams.filter((t) => t !== "All");
  const title =
    mode === "batting"
      ? "Top run scorers by team"
      : "Top wicket-takers by team";

  return (
    <>
      <div className="section-h">Per-XI breakdown</div>
      <div className="panel">
        <div className="panel-h">
          <h3>{title}</h3>
          <div className="hint">Top 5 from each XI</div>
        </div>
        <div className="panel-body">
          <div className="team-breakdown-grid">
            {teams.map((t) => (
              <TeamBlock
                key={t}
                team={t}
                data={data}
                state={state}
                mode={mode}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TeamBlock({
  team,
  data,
  state,
  mode,
}: {
  team: string;
  data: DashboardData;
  state: FilterState;
  mode: "batting" | "bowling";
}) {
  if (mode === "batting") {
    const seasonRows: Record<string, import("../../lib/types").BatRow[]> = {};
    for (const s of state.seasons)
      seasonRows[s] = data.data[s]?.bat[state.gt]?.[team] || [];
    const combined = combineBatting(seasonRows).slice(0, 5);

    return (
      <div className="team-block">
        <div className="team-block-title">{team}</div>
        {combined.length === 0 ? (
          <div className="team-block-empty">no data</div>
        ) : (
          combined.map((r, i) => (
            <div className="team-block-row" key={r.player}>
              <span className="team-block-pos">{i + 1}.</span>
              <span className="team-block-name">{r.player}</span>
              <span className="team-block-val">{r.runs}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  const seasonRows: Record<string, import("../../lib/types").BowlRow[]> = {};
  for (const s of state.seasons)
    seasonRows[s] = data.data[s]?.bowl?.[state.gt]?.[team] || [];
  const combined = combineBowling(seasonRows).slice(0, 5);

  return (
    <div className="team-block">
      <div className="team-block-title">{team}</div>
      {combined.length === 0 ? (
        <div className="team-block-empty">no data</div>
      ) : (
        combined.map((r, i) => (
          <div className="team-block-row" key={r.player}>
            <span className="team-block-pos">{i + 1}.</span>
            <span className="team-block-name">{r.player}</span>
            <span className="team-block-val">
              {r.wickets} <span className="team-block-unit">wkts</span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
