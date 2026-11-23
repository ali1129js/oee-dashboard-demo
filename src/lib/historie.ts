import { snapshotAt, buildShiftPlan } from "./simulation";
import {
  DEMO_DATUM,
  DEMO_SEED,
  SCHICHT_ZIEL,
  type SchichtZiel,
  type ShiftPlan,
  type ShiftSnapshot,
} from "./types";
import type { Kennzahlen } from "./oee";

/** Calendar day in the Europe/Berlin civil date, no clock time. */
export type Kalendertag = { year: number; month: number; day: number };

export type HistorienSchicht = {
  /** German date, same style as DEMO_DATUM: 10.11.2026 */
  datum: string;
  isoDatum: string;
  seed: number;
  plan: ShiftPlan;
  /** Full Fruehschicht, taken at shift end so the clock cannot rewrite it. */
  snapshot: ShiftSnapshot;
  kpis: Kennzahlen;
};

export type HistorieOptionen = {
  /** How many previous working days to include. Default 7. */
  anzahl?: number;
  seed?: number;
  /** Exclusive reference day (typically "today"). Default DEMO_DATUM. */
  bezugsdatum?: string;
  /** Targets used for the stored deltas. Default SCHICHT_ZIEL. */
  ziel?: SchichtZiel;
};

export function parseDeDatum(s: string): Kalendertag {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s.trim());
  if (!m) throw new Error(`Ungueltiges Datum: ${s}`);
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    throw new Error(`Ungueltiges Datum: ${s}`);
  }
  return { year, month, day };
}

export function formatDeDatum(t: Kalendertag): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(t.day)}.${pad(t.month)}.${t.year}`;
}

export function formatIsoDatum(t: Kalendertag): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${t.year}-${pad(t.month)}-${pad(t.day)}`;
}

export function istArbeitstag(t: Kalendertag): boolean {
  const w = new Date(Date.UTC(t.year, t.month - 1, t.day)).getUTCDay();
  return w !== 0 && w !== 6;
}

export function tagDavor(t: Kalendertag): Kalendertag {
  const dt = new Date(Date.UTC(t.year, t.month - 1, t.day - 1));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

/**
 * The last `anzahl` Monday-Friday dates strictly before `bis`, oldest first.
 * Weekends are skipped. No holiday calendar: the demo stays fictional and fixed.
 */
export function arbeitstageVorher(bis: Kalendertag, anzahl: number): Kalendertag[] {
  if (!Number.isFinite(anzahl) || anzahl <= 0) return [];
  const n = Math.floor(anzahl);
  const newestFirst: Kalendertag[] = [];
  let cursor = tagDavor(bis);
  // Bound the walk so a bad caller cannot hang. 3x covers weekends.
  for (let i = 0; i < n * 3 + 14 && newestFirst.length < n; i++) {
    if (istArbeitstag(cursor)) newestFirst.push(cursor);
    cursor = tagDavor(cursor);
  }
  return newestFirst.reverse();
}

/** Mix the demo seed with the civil date so each Fruehschicht is unique and stable. */
export function mischeSchichtSeed(basisSeed: number, tag: Kalendertag): number {
  const yyyymmdd = tag.year * 10_000 + tag.month * 100 + tag.day;
  let t = (basisSeed ^ yyyymmdd) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x45d9f3b) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x45d9f3b) >>> 0;
  return (t ^ (t >>> 16)) >>> 0;
}

export function baueHistorienSchicht(
  tag: Kalendertag,
  basisSeed: number = DEMO_SEED,
  ziel: SchichtZiel = SCHICHT_ZIEL
): HistorienSchicht {
  const seed = mischeSchichtSeed(basisSeed, tag);
  const plan = buildShiftPlan(seed);
  const snapshot = snapshotAt(plan, plan.endMin, ziel);
  return {
    datum: formatDeDatum(tag),
    isoDatum: formatIsoDatum(tag),
    seed,
    plan,
    snapshot,
    kpis: snapshot.kpis,
  };
}

/**
 * Fixed series of previous fictional Fruehschicht results.
 * The reference day itself is not included: it is the live shift on Uebersicht.
 */
export function baueHistorie(optionen: HistorieOptionen = {}): HistorienSchicht[] {
  const anzahl = optionen.anzahl ?? 7;
  const seed = optionen.seed ?? DEMO_SEED;
  const bezugsdatum = optionen.bezugsdatum ?? DEMO_DATUM;
  const ziel = optionen.ziel ?? SCHICHT_ZIEL;
  return arbeitstageVorher(parseDeDatum(bezugsdatum), anzahl).map((tag) =>
    baueHistorienSchicht(tag, seed, ziel)
  );
}
