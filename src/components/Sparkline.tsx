type Props = {
  values: number[];
  color: string;
  label: string;
};

export function Sparkline({ values, color, label }: Props) {
  const w = 88;
  const h = 28;
  const max = 1;
  const min = 0;
  const pts = values.length <= 1 ? values.concat(values) : values;
  const step = pts.length > 1 ? w / (pts.length - 1) : w;
  const y = (v: number) => h - 2 - ((v - min) / (max - min)) * (h - 4);
  const d = pts
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-label={label}
      role="img"
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
