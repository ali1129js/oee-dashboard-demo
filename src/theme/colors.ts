/**
 * Named tokens used by CSS and by contrast tests.
 * Text-on-background pairs must meet WCAG AA (4.5:1 for normal text).
 */
export type ThemeName = "light" | "dark";

export const THEME_KEY = "oee-dashboard-demo.theme";

export const colors = {
  light: {
    bg: "#eef2f7",
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#475569",
    border: "#d8e0ea",
    bannerBg: "#e8f1fd",
    bannerText: "#1e3a8a",
    bannerBorder: "#bfdbfe",
    ringAvail: "#2563eb",
    ringPerf: "#16a34a",
    ringQual: "#0284c7",
    ringOee: "#1d4ed8",
    bar: "#1d4ed8",
    chartLine: "#2563eb",
    chartGrid: "#e2e8f0",
    statusRun: "#166534",
    statusWarn: "#854d0e",
    statusStop: "#b91c1c",
    disabled: "#94a3b8",
  },
  dark: {
    bg: "#0b1220",
    surface: "#152033",
    text: "#f1f5f9",
    muted: "#cbd5e1",
    border: "#334155",
    bannerBg: "#172554",
    bannerText: "#dbeafe",
    bannerBorder: "#1e40af",
    ringAvail: "#60a5fa",
    ringPerf: "#4ade80",
    ringQual: "#38bdf8",
    ringOee: "#93c5fd",
    bar: "#3b82f6",
    chartLine: "#60a5fa",
    chartGrid: "#334155",
    statusRun: "#86efac",
    statusWarn: "#fde68a",
    statusStop: "#fca5a5",
    disabled: "#94a3b8",
  },
} as const;

export type ThemeColors = (typeof colors)[ThemeName];

/** Contrast pairs that must stay AA. Background then foreground. */
export const contrastPairs: Array<{
  theme: ThemeName;
  bg: keyof ThemeColors;
  fg: keyof ThemeColors;
}> = [
  { theme: "light", bg: "bg", fg: "text" },
  { theme: "light", bg: "surface", fg: "text" },
  { theme: "light", bg: "surface", fg: "muted" },
  { theme: "light", bg: "bannerBg", fg: "bannerText" },
  { theme: "light", bg: "surface", fg: "statusRun" },
  { theme: "light", bg: "surface", fg: "statusWarn" },
  { theme: "light", bg: "surface", fg: "statusStop" },
  { theme: "dark", bg: "bg", fg: "text" },
  { theme: "dark", bg: "surface", fg: "text" },
  { theme: "dark", bg: "surface", fg: "muted" },
  { theme: "dark", bg: "bannerBg", fg: "bannerText" },
  { theme: "dark", bg: "surface", fg: "statusRun" },
  { theme: "dark", bg: "surface", fg: "statusWarn" },
  { theme: "dark", bg: "surface", fg: "statusStop" },
];

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(hex: string): number {
  const chan = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const r = chan[0] ?? 0;
  const g = chan[1] ?? 0;
  const b = chan[2] ?? 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}
