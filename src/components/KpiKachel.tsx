import { alsProzent } from "@/lib/oee";

type Props = {
  label: string;
  hint?: string;
  value: number;
  delta: number;
  color: string;
};

export function KpiKachel({ label, hint, value, delta, color }: Props) {
  const pct = alsProzent(value);
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, value)));
  const deltaText =
    delta === 0
      ? "unverändert vs. Schichtstart"
      : `${delta > 0 ? "+" : ""}${delta} Prozentpunkte vs. Schichtstart`;

  return (
    <article
      className="card kpi-kachel"
      aria-label={`${label} ${pct} Prozent, ${deltaText}`}
    >
      <svg
        className="kpi-kachel__ring"
        viewBox="0 0 88 88"
        width="88"
        height="88"
        aria-hidden="true"
      >
        <circle className="kpi-kachel__track" cx="44" cy="44" r={r} />
        <circle
          className="kpi-kachel__value"
          cx="44"
          cy="44"
          r={r}
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <text x="44" y="49" textAnchor="middle" className="kpi-kachel__ring-text">
          {pct}%
        </text>
      </svg>
      <div className="kpi-kachel__body">
        <h3 className="kpi-kachel__label">{label}</h3>
        <p className="kpi-kachel__pct" style={{ color }}>
          {pct}%
        </p>
        {hint ? <p className="kpi-kachel__hint">{hint}</p> : null}
        <p className={`kpi-kachel__delta ${deltaKlass(delta)}`}>
          <DeltaPfeil delta={delta} /> {formatDelta(delta)} vs. Schichtstart
        </p>
      </div>
    </article>
  );
}

function formatDelta(delta: number): string {
  if (delta === 0) return "0%";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}%`;
}

function deltaKlass(delta: number): string {
  if (delta > 0) return "is-up";
  if (delta < 0) return "is-down";
  return "is-flat";
}

function DeltaPfeil({ delta }: { delta: number }) {
  if (delta > 0) return <span aria-hidden="true">▲</span>;
  if (delta < 0) return <span aria-hidden="true">▼</span>;
  return <span aria-hidden="true">●</span>;
}
