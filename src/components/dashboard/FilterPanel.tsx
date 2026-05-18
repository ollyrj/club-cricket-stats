import type { DashboardData } from "../../lib/types";
import type { FilterState } from "../../lib/data-utils";

type Props = {
  data: DashboardData;
  state: FilterState;
  update: (patch: Partial<FilterState>) => void;
  qualCount: number;
};

export function FilterPanel({ data, state, update, qualCount }: Props) {
  const toggleSeason = (s: string) => {
    const idx = state.seasons.indexOf(s);
    if (idx >= 0) {
      if (state.seasons.length > 1)
        update({ seasons: state.seasons.filter((x) => x !== s) });
    } else {
      update({ seasons: [...state.seasons, s].sort() });
    }
  };

  const toggleTeam = (t: string) => {
    if (t === "All") {
      update({ teams: ["All"] });
    } else {
      const filtered = state.teams.filter((x) => x !== "All");
      const idx = filtered.indexOf(t);
      if (idx >= 0) {
        filtered.splice(idx, 1);
        update({ teams: filtered.length ? filtered : ["All"] });
      } else {
        update({ teams: [...filtered, t] });
      }
    }
  };

  return (
    <div className="filters">
      <div className="filter-group">
        <div className="label-actions">
          <label>
            Seasons{" "}
            <span className="season-readout">{state.seasons.join(" + ")}</span>
          </label>
          <span
            className="mini"
            onClick={() => update({ seasons: data.seasons.slice() })}
          >
            all
          </span>
          <span
            className="mini"
            onClick={() => {
              const latest =
                data.seasons[data.seasons.length - 2] ?? data.seasons[0];
              update({ seasons: [latest] });
            }}
          >
            {data.seasons[data.seasons.length - 2] ?? data.seasons[0]} only
          </span>
        </div>
        <div className="chip-row">
          {data.seasons
            .slice()
            .sort((a, b) => b.localeCompare(a))
            .map((s) => (
              <button
                key={s}
                className={`chip season${state.seasons.includes(s) ? " active" : ""}`}
                onClick={() => toggleSeason(s)}
              >
                {s}
                {s === String(new Date().getFullYear()) ? " · live" : ""}
              </button>
            ))}
        </div>
      </div>
      <div className="filter-group">
        <div className="label-actions">
          <label>Teams</label>
          <span
            className="mini"
            onClick={() =>
              update({
                teams: data.teams.filter((t) => t !== "All"),
              })
            }
          >
            all XIs
          </span>
          <span className="mini" onClick={() => update({ teams: ["All"] })}>
            all (combined)
          </span>
        </div>
        <div className="chip-row">
          {data.teams.map((t) => (
            <button
              key={t}
              className={`chip${state.teams.includes(t) ? " active" : ""}`}
              onClick={() => toggleTeam(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <label>Competition</label>
        <div className="chip-row">
          {data.gameTypes.map((g) => (
            <button
              key={g}
              className={`chip${g === state.gt ? " active" : ""}`}
              onClick={() => update({ gt: g })}
            >
              {g === "All" ? "All comps" : g}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <label>
          {state.mode === "batting" ? "Min Innings" : "Min Overs"}{" "}
          <span className="qual-readout">{state.minQual}</span>
        </label>
        <div className="slider-row">
          <input
            type="range"
            min={1}
            max={state.mode === "batting" ? 20 : 100}
            step={1}
            value={state.minQual}
            onChange={(e) => update({ minQual: +e.target.value })}
          />
          <span className="val">{qualCount} qualify</span>
        </div>
      </div>
    </div>
  );
}
