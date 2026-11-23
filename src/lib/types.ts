export const STATION_IDS = ["blistermaschine", "kartonierer", "serialisierung"] as const;
export type StationId = (typeof STATION_IDS)[number];

export const STATION_NAMEN: Record<StationId, string> = {
  blistermaschine: "Blistermaschine",
  kartonierer: "Kartonierer",
  serialisierung: "Serialisierung",
};

export const STOP_REASONS = [
  "Formatwechsel",
  "Materialmangel",
  "Störung Kartonierer",
  "Reinigung",
] as const;
export type StopReason = (typeof STOP_REASONS)[number];

export const ANLAGEN_STATI = ["laeuft", "warnung", "steht"] as const;
export type Anlagenstatus = (typeof ANLAGEN_STATI)[number];

export const STATUS_LABEL: Record<Anlagenstatus, string> = {
  laeuft: "Läuft",
  warnung: "Warnung",
  steht: "Steht",
};

/** Minutes from midnight. Fruehschicht 06:00-14:00. Kept as aliases for that window. */
export const SCHICHT_IDS = ["frueh", "spaet", "nacht"] as const;
export type SchichtId = (typeof SCHICHT_IDS)[number];

export type Schichtfenster = {
  id: SchichtId;
  name: string;
  /** Minutes from midnight; Nachtschicht end may be >= 24 * 60. */
  startMin: number;
  endMin: number;
};

export const SCHICHTEN: Record<SchichtId, Schichtfenster> = {
  frueh: { id: "frueh", name: "Früh", startMin: 6 * 60, endMin: 14 * 60 },
  spaet: { id: "spaet", name: "Spät", startMin: 14 * 60, endMin: 22 * 60 },
  nacht: { id: "nacht", name: "Nacht", startMin: 22 * 60, endMin: 30 * 60 },
};

export const SHIFT_START_MIN = SCHICHTEN.frueh.startMin;
export const SHIFT_END_MIN = SCHICHTEN.frueh.endMin;
export const SHIFT_DAUER_MIN = SHIFT_END_MIN - SHIFT_START_MIN;
/** First sample used for "vs. Schichtstart" deltas on the Fruehschicht. */
export const BASELINE_MIN = SHIFT_START_MIN + 30;
/** Default paused view for the Fruehschicht: mid-to-late, so the dashboard looks complete. */
export const DEMO_NOW_MIN = 13 * 60 + 45;

export function schichtBaselineMin(startMin: number): number {
  return startMin + 30;
}

export function schichtDemoNowMin(endMin: number): number {
  return endMin - 15;
}

export function schichtNameLang(id: SchichtId): string {
  return `${SCHICHTEN[id].name}schicht`;
}
export const DEMO_SEED = 2026_11_19;
export const DEMO_DATUM = "19.11.2026";
export const LINIE_NAME = "Linie 3 Demo";
export const LINIE_UNTERTITEL = "Blisterverpackungslinie - Northwind Pharma";
export const FIRMA = "Northwind Pharma";
export const SIM_BANNER = "Simulation - Beispieldaten: Alle Werte sind simuliert.";

/** Below this OEE, a running station is shown as Warnung. */
export const WARNUNG_OEE = 0.75;

/** Shift targets used for KPI deltas, labelled "vs. Schichtziel". */
export type SchichtZiel = {
  verfuegbarkeit: number;
  leistung: number;
  qualitaet: number;
  oee: number;
};

export const SCHICHT_ZIEL: SchichtZiel = {
  verfuegbarkeit: 0.9,
  leistung: 0.9,
  qualitaet: 0.99,
  oee: 0.8,
};

export type StopEvent = {
  stationId: StationId;
  reason: StopReason;
  startMin: number;
  durationMin: number;
};

export type StationPlan = {
  id: StationId;
  name: string;
  idealUnitsPerMin: number;
  /** Share of produced units that are good, in [0, 1]. */
  qualityYield: number;
  /** How close the station runs to its ideal rate while up, in [0, 1]. */
  speedFactor: number;
  stops: StopEvent[];
};

export type ShiftPlan = {
  seed: number;
  startMin: number;
  endMin: number;
  stations: StationPlan[];
};

export type StillstandSumme = {
  reason: StopReason;
  durationMin: number;
  count: number;
};

export type OeePunkt = {
  minute: number;
  label: string;
  oee: number;
};

export type StationSnapshot = {
  id: StationId;
  name: string;
  status: Anlagenstatus;
  kpis: import("./oee").Kennzahlen;
  oee: number;
  sparkline: number[];
  activeStop: StopEvent | null;
};

export type ShiftSnapshot = {
  nowMin: number;
  plannedMin: number;
  runMin: number;
  totalUnits: number;
  goodUnits: number;
  kpis: import("./oee").Kennzahlen;
  startKpis: import("./oee").Kennzahlen;
  deltas: {
    verfuegbarkeit: number;
    leistung: number;
    qualitaet: number;
    oee: number;
  };
  oeeUeberSchicht: OeePunkt[];
  stillstaende: StillstandSumme[];
  stations: StationSnapshot[];
};
