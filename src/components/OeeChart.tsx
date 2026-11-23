import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SHIFT_END_MIN, SHIFT_START_MIN, type OeePunkt } from "@/lib/types";
import { formatUhrzeit } from "@/lib/zeit";
import { colors, type ThemeName } from "@/theme/colors";

type Props = {
  data: OeePunkt[];
  theme: ThemeName;
  schichtLabel: string;
  startMin?: number;
  endMin?: number;
};

export function OeeChart({
  data,
  theme,
  schichtLabel,
  startMin = SHIFT_START_MIN,
  endMin = SHIFT_END_MIN,
}: Props) {
  const c = colors[theme];
  const hourTicks = Array.from({ length: 9 }, (_, i) => startMin + i * 60);
  return (
    <section className="card chart-card" aria-label="OEE über die Schicht">
      <header className="card__head">
        <h2>OEE über die Schicht</h2>
        <p className="muted small">{schichtLabel}</p>
      </header>
      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.chartGrid} />
            <XAxis
              type="number"
              dataKey="minute"
              domain={[startMin, endMin]}
              ticks={hourTicks}
              tickFormatter={(v: number) => formatUhrzeit(v)}
              tick={{ fill: c.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: c.border }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: c.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(v: number) => String(v)}
            />
            <Tooltip
              isAnimationActive={false}
              labelFormatter={(label) => formatUhrzeit(Number(label))}
              contentStyle={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                color: c.text,
              }}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value);
                return [`${Number.isFinite(n) ? n.toFixed(1) : value} %`, "OEE"];
              }}
            />
            <Line
              type="monotone"
              dataKey="oee"
              name="OEE"
              stroke={c.chartLine}
              strokeWidth={2.5}
              dot={{ r: 3, fill: c.chartLine, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
