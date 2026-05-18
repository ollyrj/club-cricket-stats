import { useState, useCallback } from "react";
import type { DashboardData } from "../../lib/types";
import type {
  FilterState,
  HeaderDef,
  CombinedBatRow,
  CombinedBowlRow,
} from "../../lib/data-utils";
import {
  compareBest,
  getPlayerForm,
  isInForm,
  teamTagClass,
} from "../../lib/data-utils";

type AnyRow = CombinedBatRow | CombinedBowlRow;

type Props = {
  rows: AnyRow[];
  headers: HeaderDef[];
  mode: "batting" | "bowling";
  state: FilterState;
  data: DashboardData;
  update: (patch: Partial<FilterState>) => void;
};

export function Leaderboard({
  rows,
  headers,
  mode,
  state,
  data,
  update,
}: Props) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const handleSort = useCallback(
    (h: HeaderDef) => {
      if (state.sortKey === h.key) {
        update({ sortDir: (state.sortDir * -1) as 1 | -1 });
      } else {
        update({ sortKey: h.key, sortDir: h.def });
      }
    },
    [state.sortKey, state.sortDir, update],
  );

  const isBat = mode === "batting";
  const modeStr = isBat ? "bat" : "bowl";

  const sorted = rows.slice().sort((a, b) => {
    const h = headers.find((x) => x.key === state.sortKey);
    if (h?.qual) {
      const aQ = isBat
        ? (a as CombinedBatRow).inns >= state.minQual
        : (a as CombinedBowlRow).overs >= state.minQual;
      const bQ = isBat
        ? (b as CombinedBatRow).inns >= state.minQual
        : (b as CombinedBowlRow).overs >= state.minQual;
      if (aQ && !bQ) return -1;
      if (!aQ && bQ) return 1;
    }
    if (h?.custom === "best") {
      return (
        state.sortDir *
        compareBest(
          (a as CombinedBowlRow).bestObj,
          (b as CombinedBowlRow).bestObj,
        )
      );
    }
    const av = (a as Record<string, unknown>)[state.sortKey];
    const bv = (b as Record<string, unknown>)[state.sortKey];
    if (typeof av === "string")
      return state.sortDir * (av as string).localeCompare(bv as string);
    return state.sortDir * ((av as number) - (bv as number));
  });

  const title = isBat ? "Batting Leaderboard" : "Bowling Leaderboard";
  const hint = isBat
    ? "Sortable · Avg / SR re-derived for combined seasons"
    : "Sortable · Econ / SR / Avg recomputed for combined seasons";

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>{title}</h3>
        <div className="hint">{hint}</div>
      </div>
      <div className="scroll-area panel-body">
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={`${h.cls || ""}${state.sortKey === h.key ? " sorted" : ""}`}
                  onClick={() => handleSort(h)}
                >
                  {h.label}
                  <span className="sort-ind">
                    {state.sortKey === h.key
                      ? state.sortDir === -1
                        ? "▼"
                        : "▲"
                      : "↕"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="empty">
                  No data for this filter combination.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => {
                const formMode = state.mode;
                const formRows = getPlayerForm(data, r.player, formMode, state);
                const inForm = isInForm(formRows, formMode);
                const isExpanded = expandedPlayer === r.player;

                return (
                  <LeaderboardRow
                    key={r.player}
                    row={r}
                    index={i}
                    headers={headers}
                    mode={modeStr}
                    state={state}
                    inForm={inForm}
                    isExpanded={isExpanded}
                    formRows={formRows}
                    formMode={formMode}
                    onToggle={() =>
                      setExpandedPlayer(isExpanded ? null : r.player)
                    }
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaderboardRow({
  row,
  index,
  headers,
  mode,
  state,
  inForm,
  isExpanded,
  formRows,
  formMode,
  onToggle,
}: {
  row: AnyRow;
  index: number;
  headers: HeaderDef[];
  mode: string;
  state: FilterState;
  inForm: boolean;
  isExpanded: boolean;
  formRows: ReturnType<typeof getPlayerForm>;
  formMode: "batting" | "bowling";
  onToggle: () => void;
}) {
  const medalClass =
    index === 0
      ? " medal-1"
      : index === 1
        ? " medal-2"
        : index === 2
          ? " medal-3"
          : "";

  return (
    <>
      <tr
        className={`lb-row${medalClass}${isExpanded ? " expanded" : ""}`}
        onClick={onToggle}
      >
        {headers.map((h) => {
          let v: string | number;
          if (h.key === "rank") v = index + 1;
          else if (h.display) v = h.display(row);
          else v = (row as Record<string, unknown>)[h.key] as string | number;

          const isBat = mode === "bat";
          const meetsQual = h.qual
            ? isBat
              ? (row as CombinedBatRow).inns >= state.minQual
              : (row as CombinedBowlRow).overs >= state.minQual
            : true;

          const isStrong =
            (isBat && h.key === "runs") || (!isBat && h.key === "wickets");

          const classes = [
            h.cls || "",
            !meetsQual && h.qual ? "dim" : "",
            isStrong ? "runs-strong" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <td key={h.key} className={classes || undefined}>
              {h.key === "player" ? (
                <>
                  {v}
                  {inForm && (
                    <span className="fire-emoji" title="In form">
                      🔥
                    </span>
                  )}
                  <span className="chev">▶</span>
                </>
              ) : (
                v
              )}
            </td>
          );
        })}
      </tr>
      {isExpanded && (
        <tr className="expand-row">
          <td colSpan={headers.length} style={{ padding: 0 }}>
            <FormStrip rows={formRows} mode={formMode} />
          </td>
        </tr>
      )}
    </>
  );
}

function FormStrip({
  rows,
  mode,
}: {
  rows: ReturnType<typeof getPlayerForm>;
  mode: "batting" | "bowling";
}) {
  if (!rows.length) {
    return (
      <div className="form-strip">
        <div className="form-h">Recent</div>
        <div className="form-empty">
          No top performances on record for the selected seasons.
        </div>
      </div>
    );
  }

  return (
    <div className="form-strip">
      <div className="form-h">
        {mode === "batting" ? "Recent innings" : "Recent spells"}
      </div>
      {rows.map((p, i) => {
        const n = parseInt(String(p.score).replace(/\D/g, "")) || 0;
        let cls = mode === "bowling" ? "bowling" : "";
        if (mode === "batting") {
          if (n >= 100) cls = "hundred";
          else if (n >= 50) cls = "fifty";
        } else {
          const m = String(p.score).match(/^(\d+)\s*\/\s*\d+/);
          const w = m ? parseInt(m[1]) : 0;
          if (w >= 5) cls = "bowling fifer";
        }
        const teamCls = teamTagClass(p.team);
        const oppShort =
          (p.opposition || "")
            .replace(/CC.*/, "CC")
            .replace(/-.*/, "")
            .trim()
            .substring(0, 16) || "unknown";

        return (
          <div key={i} className={`form-pill ${cls}`}>
            <div className="score">{p.score}</div>
            <div className="meta">
              <span className="vs" title={p.opposition}>
                vs {oppShort}
              </span>
              <span>{p.dateLabel}</span>
            </div>
            <div className={`team-tag ${teamCls}`}>{p.team}</div>
          </div>
        );
      })}
    </div>
  );
}
