/**
 * Named tokens used by CSS and by contrast tests.
 * Text-on-background pairs must meet WCAG AA (4.5:1 for normal text).
 * Brand fills (Jade, Saffron, Garnet, Cobalt) are tested against their on-colours,
 * not as body text, because those fills are used on glossy badges and buttons.
 */
export const THEME_NAMES = ["khaki", "darkgrey", "midnight"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const THEME_LABELS: Readonly<Record<ThemeName, string>> = {
  khaki: "Khaki",
  darkgrey: "Dunkelgrau",
  midnight: "Mitternacht",
};

export const THEME_KEY = "oee-dashboard-demo.theme";
export const MOTION_KEY = "oee-dashboard-demo.motion";
export const MOTION_NAMES = ["static", "animated"] as const;
export type MotionName = (typeof MOTION_NAMES)[number];

export const GLOSS = {
  cobalt: "#2F6BFF",
  onCobalt: "#FFFFFF",
  pewter: "#7A8394",
  onPewter: "#111111",
  jade: "#00B386",
  onJade: "#111111",
  garnet: "#D42D47",
  onGarnet: "#FFFFFF",
  saffron: "#FFB000",
  onSaffron: "#111111",
  lagoon: "#00C2D1",
  onLagoon: "#111111",
} as const;

export const colors = {
  khaki: {
    bg: "#D8CDAE",
    surface: "#EBE4D0",
    text: "#2A2418",
    muted: "#554C3E",
    border: "#6F6550",
    bannerBg: "#E4F3F4",
    bannerText: "#006169",
    bannerBorder: "#00A8B5",
    ringAvail: "#214BB3",
    ringPerf: "#00624A",
    ringQual: "#006169",
    ringOee: "#214BB3",
    bar: "#214BB3",
    chartLine: GLOSS.cobalt,
    chartGrid: "#CFC4A8",
    statusRun: GLOSS.jade,
    statusRunOn: GLOSS.onJade,
    statusWarn: GLOSS.saffron,
    statusWarnOn: GLOSS.onSaffron,
    statusStop: GLOSS.garnet,
    statusStopOn: GLOSS.onGarnet,
    disabled: "#7A6F56",
  },
  darkgrey: {
    bg: "#2A2C30",
    surface: "#3A3D43",
    text: "#E6E6E6",
    muted: "#C5C8CE",
    border: "#8A8E96",
    bannerBg: "#16303A",
    bannerText: "#9BE7EE",
    bannerBorder: "#00A8B5",
    ringAvail: "#8DAEFF",
    ringPerf: "#26BE98",
    ringQual: GLOSS.lagoon,
    ringOee: "#8DAEFF",
    bar: GLOSS.cobalt,
    chartLine: GLOSS.cobalt,
    chartGrid: "#4A4E56",
    statusRun: GLOSS.jade,
    statusRunOn: GLOSS.onJade,
    statusWarn: GLOSS.saffron,
    statusWarnOn: GLOSS.onSaffron,
    statusStop: GLOSS.garnet,
    statusStopOn: GLOSS.onGarnet,
    disabled: "#A8ADB4",
  },
  midnight: {
    bg: "#1B1428",
    surface: "#2A2238",
    text: "#EDE7F6",
    muted: "#C9C2D6",
    border: "#7A7288",
    bannerBg: "#142830",
    bannerText: "#9BE7EE",
    bannerBorder: "#00A8B5",
    ringAvail: "#789FFF",
    ringPerf: "#26BE98",
    ringQual: GLOSS.lagoon,
    ringOee: "#789FFF",
    bar: GLOSS.cobalt,
    chartLine: GLOSS.cobalt,
    chartGrid: "#3A3250",
    statusRun: GLOSS.jade,
    statusRunOn: GLOSS.onJade,
    statusWarn: GLOSS.saffron,
    statusWarnOn: GLOSS.onSaffron,
    statusStop: GLOSS.garnet,
    statusStopOn: GLOSS.onGarnet,
    disabled: "#B6AFC4",
  },
} as const;

export type ThemeColors = (typeof colors)[ThemeName];

/** Contrast pairs that must stay AA. Background then foreground. */
export const contrastPairs: Array<{
  theme: ThemeName;
  bg: keyof ThemeColors;
  fg: keyof ThemeColors;
}> = THEME_NAMES.flatMap((theme) => [
  { theme, bg: "bg", fg: "text" },
  { theme, bg: "surface", fg: "text" },
  { theme, bg: "surface", fg: "muted" },
  { theme, bg: "bannerBg", fg: "bannerText" },
  { theme, bg: "statusRun", fg: "statusRunOn" },
  { theme, bg: "statusWarn", fg: "statusWarnOn" },
  { theme, bg: "statusStop", fg: "statusStopOn" },
  { theme, bg: "surface", fg: "ringAvail" },
  { theme, bg: "surface", fg: "ringPerf" },
  { theme, bg: "surface", fg: "ringQual" },
  { theme, bg: "surface", fg: "ringOee" },
]);

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

export function contrastMeets(a: string, b: string, min: number): boolean {
  return Number(contrastRatio(a, b).toFixed(2)) >= min;
}
