import type { ClubTheme } from "../../lib/types";
import type { FilterState } from "../../lib/data-utils";

type Props = {
  clubName: string;
  mode: "batting" | "bowling";
  state: FilterState;
  onSwitchMode: (mode: "batting" | "bowling") => void;
  theme: ClubTheme;
  crestSvg?: string;
};

export function Header({ clubName, mode, state, onSwitchMode, theme }: Props) {
  const qualText =
    mode === "batting"
      ? `min ${state.minQual} inns`
      : `min ${state.minQual} overs`;
  const summary = `${mode === "batting" ? "Batting" : "Bowling"} · ${state.gt === "All" ? "All comps" : state.gt} · ${state.teams.join("+")} · ${state.seasons.join("+")} · ${qualText}`;

  return (
    <div
      className="top"
      style={{
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
        borderBottom: `4px solid ${theme.accent}`,
      }}
    >
      <div className="container">
        <div className="top-inner">
          <div className="brand">
            <div className="crest" style={{ borderColor: theme.accent }}>
              <svg
                viewBox="0 0 50 50"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <g transform="translate(5.32 9.542)">
                  <path
                    d="M19.638,0C23.854,0,39.36,28.366,39.36,28.366l-3.583.358L19.638,5.333,3.712,28.739,0,28.366S15.422,0,19.638,0Z"
                    fill={theme.primary}
                    transform="translate(39.36 30.459) rotate(180)"
                  />
                  <path
                    d="M12.775,0C15.992,0,25.55,22.183,25.55,22.183l-3.463,1.289A83.4,83.4,0,0,0,17.3,10.653C16.032,8.1,14.376,3.922,12.775,3.922c-1.464,0-2.983,3.8-4.558,6.734C5.6,15.52,3.365,23.473,3.365,23.473L0,22.183S9.558,0,12.775,0Z"
                    fill={theme.primary}
                    transform="translate(32.456 23.473) rotate(180)"
                  />
                </g>
              </svg>
            </div>
            <div className="title">
              <h1>{clubName} — Stats Dashboard</h1>
              <div className="sub">
                Senior cricket leaderboards
                <span className="meta-pill">{summary}</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <div className="main-tabs">
            <button
              className={`main-tab${mode === "batting" ? " active" : ""}`}
              onClick={() => onSwitchMode("batting")}
            >
              Batting
            </button>
            <button
              className={`main-tab${mode === "bowling" ? " active" : ""}`}
              onClick={() => onSwitchMode("bowling")}
            >
              Bowling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
