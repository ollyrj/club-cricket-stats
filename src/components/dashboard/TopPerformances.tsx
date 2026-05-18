import type { TopBatEntry, TopBowlEntry } from "../../lib/data-utils";

type Props = {
  mode: "batting" | "bowling";
  topBat: TopBatEntry[];
  topBowl: TopBowlEntry[];
  multiSeason: boolean;
};

export function TopPerformances({ mode, topBat, topBowl, multiSeason }: Props) {
  const title =
    mode === "batting" ? "Top Individual Innings" : "Top Bowling Spells";
  const hint = mode === "batting" ? "Highest scores" : "Best figures";

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>{title}</h3>
        <div className="hint">{hint}</div>
      </div>
      <div className="scroll-area panel-body">
        {mode === "batting" ? (
          topBat.length === 0 ? (
            <div className="empty">No innings recorded.</div>
          ) : (
            topBat.map((r, i) => (
              <div
                key={`${r.player}-${r.date}-${r.score}`}
                className={`inn-row${i === 0 ? " gold" : ""}`}
              >
                <div className="inn-score">{r.score}</div>
                <div className="inn-meta">
                  <div className="name">
                    {r.player}
                    {multiSeason && <span className="badge">{r.season}</span>}
                  </div>
                  <div className="vs">{r.match}</div>
                  <div className="date">{r.date}</div>
                </div>
              </div>
            ))
          )
        ) : topBowl.length === 0 ? (
          <div className="empty">No spells recorded.</div>
        ) : (
          topBowl.map((r, i) => (
            <div
              key={`${r.player}-${r.date}-${r.figures}`}
              className={`inn-row bowling${i === 0 ? " gold" : ""}`}
            >
              <div className="inn-score">{r.figures}</div>
              <div className="inn-meta">
                <div className="name">
                  {r.player}
                  {multiSeason && <span className="badge">{r.season}</span>}
                </div>
                <div className="vs">{r.match}</div>
                <div className="date">{r.date}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
