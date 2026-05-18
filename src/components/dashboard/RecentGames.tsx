import type { RecentMatch } from "../../lib/data-utils";
import { teamTagClass } from "../../lib/data-utils";

type Props = {
  matches: RecentMatch[];
  mode: "batting" | "bowling";
};

export function RecentGames({ matches, mode }: Props) {
  const title =
    mode === "batting"
      ? "Last 5 games — top batting performances"
      : "Last 5 games — top bowling spells";

  return (
    <>
      <div className="section-h">{title}</div>
      <div className="recent-games">
        {matches.length === 0 ? (
          <div
            className="empty"
            style={{
              background: "white",
              borderRadius: 10,
              padding: 20,
            }}
          >
            No recent top performances for this filter combination.
          </div>
        ) : (
          matches.map((m) => {
            const perfs = m.perfs
              .sort((a, b) => {
                const aN = parseInt(String(a.score).replace(/\D/g, "")) || 0;
                const bN = parseInt(String(b.score).replace(/\D/g, "")) || 0;
                return bN - aN;
              })
              .slice(0, 3);

            return (
              <div className="recent-card" key={m.date + m.team}>
                <div className="rc-h">
                  <div>
                    <div className="rc-date">{m.dateLabel}</div>
                    <div className="rc-opp">vs {m.opposition || "unknown"}</div>
                  </div>
                  <div className={`rc-team team-tag ${teamTagClass(m.team)}`}>
                    {m.team}
                  </div>
                </div>
                <div className="rc-perfs">
                  {perfs.map((p, i) => (
                    <div
                      key={i}
                      className={`rc-perf${mode === "bowling" ? " bowl" : ""}`}
                    >
                      <span className="pl">{p.player}</span>
                      <span className="sc">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
