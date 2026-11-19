import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StillstandSumme } from "@/lib/types";
import { colors, type ThemeName } from "@/theme/colors";

type Props = {
  rows: StillstandSumme[];
  theme: ThemeName;
};

function useNarrow(px = 600): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [px]);
  return narrow;
}

export function Stillstandsgruende({ rows, theme }: Props) {
  const c = colors[theme];
  const narrow = useNarrow();
  const data = rows.map((r) => ({
    ...r,
    name: r.reason,
    endLabel: narrow
      ? `${r.durationMin} min ${r.count}x`
      : `${r.durationMin} min  ${r.count}x`,
  }));

  return (
    <section className="card stillstand-card" aria-label="Stillstandsgründe">
      <header className="card__head">
        <h2>Stillstandsgründe</h2>
        <p className="legend">
          <span className="legend__swatch" style={{ background: c.bar }} />
          Dauer (min)
          <span className="legend__note">Häufigkeit rechts</span>
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="muted">Bisher keine Stillstände in dieser Schicht.</p>
      ) : (
        <div className="stillstand-card__body">
          <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 52)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 4,
                right: narrow ? 96 : 84,
                left: narrow ? 4 : 16,
                bottom: 8,
              }}
              barCategoryGap={14}
            >
              <XAxis
                type="number"
                tick={{ fill: c.muted, fontSize: 12 }}
                axisLine={{ stroke: c.border }}
                tickLine={false}
                label={{
                  value: "Dauer (min)",
                  position: "insideBottom",
                  offset: -2,
                  fill: c.muted,
                  fontSize: 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={narrow ? 122 : 140}
                tick={{ fill: c.text, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                isAnimationActive={false}
                contentStyle={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                  color: c.text,
                }}
                formatter={(value, _name, item) => {
                  const n = typeof value === "number" ? value : Number(value);
                  const count =
                    (item?.payload as StillstandSumme | undefined)?.count ?? 0;
                  return [`${n} min, ${count}x`, "Dauer"];
                }}
              />
              <Bar
                dataKey="durationMin"
                fill={c.bar}
                radius={[0, 6, 6, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="endLabel"
                  position="right"
                  style={{ fill: c.text, fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <ul className="sr-only">
        {rows.map((r) => (
          <li key={r.reason}>
            {r.reason}: {r.durationMin} Minuten, {r.count} Mal
          </li>
        ))}
      </ul>
    </section>
  );
}
