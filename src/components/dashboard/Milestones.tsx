import type {
  FilterState,
  CombinedBatRow,
  CombinedBowlRow,
} from "../../lib/data-utils";

type Props = {
  mode: "batting" | "bowling";
  batRows: CombinedBatRow[];
  bowlRows: CombinedBowlRow[];
  state: FilterState;
};

export function Milestones({ mode, batRows, bowlRows, state }: Props) {
  if (mode === "batting") {
    const cent = batRows
      .filter((r) => r.hundreds > 0)
      .sort((a, b) => b.hundreds - a.hundreds || b.runs - a.runs)
      .slice(0, 10);
    const fif = batRows
      .filter((r) => r.fifties + r.hundreds > 0)
      .sort(
        (a, b) =>
          b.fifties + b.hundreds - (a.fifties + a.hundreds) || b.runs - a.runs,
      )
      .slice(0, 10);
    const quals = batRows
      .filter((r) => r.inns >= state.minQual && r.sr > 0)
      .sort((a, b) => b.sr - a.sr)
      .slice(0, 10);

    return (
      <>
        <div className="section-h">Milestones &amp; Hitters</div>
        <div className="milestones-grid">
          <BarPanel
            title="Most Hundreds"
            hint="100+ innings"
            rows={cent}
            valFn={(r) => r.hundreds}
          />
          <BarPanel
            title="Most Fifties"
            hint="50+ scores"
            rows={fif}
            valFn={(r) => r.fifties + r.hundreds}
          />
          <BarPanel
            title="Boundary Hitters"
            hint="Top strike rates · qualifies"
            rows={quals}
            valFn={(r) => r.sr}
            formatFn={(v) => v.toFixed(1)}
          />
        </div>
      </>
    );
  }

  const wkt = bowlRows
    .filter((r) => r.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 10);
  const fiveW = bowlRows
    .filter((r) => r.fiveW > 0)
    .sort((a, b) => b.fiveW - a.fiveW || b.wickets - a.wickets)
    .slice(0, 10);
  const quals = bowlRows
    .filter((r) => r.overs >= state.minQual && r.econ > 0)
    .sort((a, b) => a.econ - b.econ)
    .slice(0, 10);

  return (
    <>
      <div className="section-h">Bowling Honours</div>
      <div className="milestones-grid">
        <BarPanel
          title="Most Wickets"
          hint="Total scalps"
          rows={wkt}
          valFn={(r) => r.wickets}
        />
        <BarPanel
          title="Most 5-Wicket Hauls"
          hint="5+ wickets in an innings"
          rows={fiveW}
          valFn={(r) => r.fiveW}
        />
        <EconPanel rows={quals} />
      </div>
    </>
  );
}

function BarPanel<T extends { player: string }>({
  title,
  hint,
  rows,
  valFn,
  formatFn,
}: {
  title: string;
  hint: string;
  rows: T[];
  valFn: (r: T) => number;
  formatFn?: (v: number) => string;
}) {
  const max = rows.length ? Math.max(...rows.map(valFn), 0.1) : 1;

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>{title}</h3>
        <div className="hint">{hint}</div>
      </div>
      <div className="panel-body">
        {rows.length === 0 ? (
          <div className="empty">No qualifying players.</div>
        ) : (
          rows.map((r, i) => {
            const v = valFn(r);
            return (
              <div className="bar-row" key={r.player}>
                <div className="pos">{i + 1}</div>
                <div className="name">{r.player}</div>
                <div className="bar">
                  <div style={{ width: `${((v / max) * 100).toFixed(0)}%` }} />
                </div>
                <div className="val">{formatFn ? formatFn(v) : v}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EconPanel({ rows }: { rows: CombinedBowlRow[] }) {
  if (!rows.length) {
    return (
      <div className="panel">
        <div className="panel-h">
          <h3>Best Economy</h3>
          <div className="hint">Lowest RPO · qualifies</div>
        </div>
        <div className="panel-body">
          <div className="empty">No qualifying bowlers.</div>
        </div>
      </div>
    );
  }

  const minE = rows[0].econ;
  const maxE = rows[rows.length - 1].econ;
  const range = maxE - minE || 1;

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>Best Economy</h3>
        <div className="hint">Lowest RPO · qualifies</div>
      </div>
      <div className="panel-body">
        {rows.map((r, i) => {
          const inv = 100 - ((r.econ - minE) / range) * 100;
          return (
            <div className="bar-row" key={r.player}>
              <div className="pos">{i + 1}</div>
              <div className="name">{r.player}</div>
              <div className="bar">
                <div
                  style={{
                    width: `${Math.max(20, inv).toFixed(0)}%`,
                  }}
                />
              </div>
              <div className="val">{r.econ.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
