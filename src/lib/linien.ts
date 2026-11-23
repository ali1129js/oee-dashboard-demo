import { buildShiftPlan, snapshotAt } from "./simulation";
import {
  DEMO_NOW_MIN,
  DEMO_SEED,
  SCHICHT_ZIEL,
  type Anlagenstatus,
  type SchichtZiel,
  type ShiftPlan,
  type ShiftSnapshot,
  type StopEvent,
} from "./types";
import type { Kennzahlen } from "./oee";

/**
 * Plant view data model: three made-up lines of the fictional Northwind Pharma.
 * Each line is the seeded shift plan, tuned by a few multipliers and extra stops,
 * so the three lines differ but stay reproducible. Pure functions only.
 */
export const LINIEN_IDS = ["linie-1", "linie-2", "linie-3"] as const;
export type LinienId = (typeof LINIEN_IDS)[number];

export type LinienDefinition = {
  id: LinienId;
  name: string;
  untertitel: string;
  seed: number;
  /** Multiplies every station's speedFactor (result stays within [0.5, 1]). */
  tempoFaktor: number;
  /** Multiplies every station's qualityYield (result stays within [0.9, 1]). */
  ausbeuteFaktor: number;
  /** Stop plans added on top of the seeded ones. */
  zusatzStopps: ReadonlyArray<
    Omit<StopEvent, "stationId"> & { stationId: StopEvent["stationId"] }
  >;
};

export const LINIEN: readonly LinienDefinition[] = [
  {
    id: "linie-1",
    name: "Linie 1 Demo",
    untertitel: "Blisterlinie klein - Northwind Pharma",
    seed: 2026_11_01,
    tempoFaktor: 1.02,
    ausbeuteFaktor: 1.003,
    zusatzStopps: [],
  },
  {
    id: "linie-2",
    name: "Linie 2 Demo",
    untertitel: "Blisterlinie Standard - Northwind Pharma",
    seed: 2026_11_08,
    tempoFaktor: 0.95,
    ausbeuteFaktor: 0.997,
    zusatzStopps: [
      {
        stationId: "kartonierer",
        reason: "Materialmangel",
        startMin: 10 * 60 + 30,
        durationMin: 14,
      },
    ],
  },
  {
    id: "linie-3",
    name: "Linie 3 Demo",
    untertitel: "Blisterverpackungslinie - Northwind Pharma",
    seed: 2026_11_19,
    tempoFaktor: 1,
    ausbeuteFaktor: 1,
    zusatzStopps: [],
  },
];

export type LinienPlan = { definition: LinienDefinition; plan: ShiftPlan };

export type LinienSnapshot = {
  id: LinienId;
  name: string;
  untertitel: string;
  kpis: Kennzahlen;
  /** Difference to the shift target in percentage points. */
  deltaOee: number;
  totalUnits: number;
  stillstandMin: number;
  snapshot: ShiftSnapshot;
};

export type Linienvergleich = {
  linien: LinienSnapshot[];
  /** Mean OEE over the lines, in [0, 1]. */
  durchschnittOee: number;
  totalUnits: number;
  goodUnits: number;
  /** Highest and lowest OEE, or null when there are no lines. */
  beste: LinienSnapshot | null;
  schlechteste: LinienSnapshot | null;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function baueLinienPlan(def: LinienDefinition): LinienPlan {
  const basis = buildShiftPlan(def.seed);
  const stations = basis.stations.map((s) => ({
    ...s,
    speedFactor: clamp(s.speedFactor * def.tempoFaktor, 0.5, 1),
    qualityYield: clamp(s.qualityYield * def.ausbeuteFaktor, 0.9, 1),
    stops: [...s.stops, ...def.zusatzStopps.filter((z) => z.stationId === s.id)].sort(
      (a, b) => a.startMin - b.startMin
    ),
  }));
  return { definition: def, plan: { ...basis, stations } };
}

export function baueAlleLinienPlaene(
  definitionen: readonly LinienDefinition[] = LINIEN,
  linie3Seed: number = DEMO_SEED
): LinienPlan[] {
  return definitionen.map((def) =>
    baueLinienPlan(def.id === "linie-3" ? { ...def, seed: linie3Seed } : def)
  );
}

export function linienSnapshot(
  lp: LinienPlan,
  nowMin: number,
  ziel: SchichtZiel = SCHICHT_ZIEL
): LinienSnapshot {
  const snapshot = snapshotAt(lp.plan, nowMin, ziel);
  const stillstandMin = snapshot.stillstaende.reduce((sum, s) => sum + s.durationMin, 0);
  return {
    id: lp.definition.id,
    name: lp.definition.name,
    untertitel: lp.definition.untertitel,
    kpis: snapshot.kpis,
    deltaOee: snapshot.deltas.oee,
    totalUnits: snapshot.totalUnits,
    stillstandMin,
    snapshot,
  };
}

/** Compare all lines at one time. Ties on OEE keep the earlier line. */
export function vergleicheLinien(
  plaene: readonly LinienPlan[],
  nowMin: number = DEMO_NOW_MIN,
  ziel: SchichtZiel = SCHICHT_ZIEL
): Linienvergleich {
  const linien = plaene.map((p) => linienSnapshot(p, nowMin, ziel));
  if (linien.length === 0) {
    return {
      linien,
      durchschnittOee: 0,
      totalUnits: 0,
      goodUnits: 0,
      beste: null,
      schlechteste: null,
    };
  }
  let beste = linien[0]!;
  let schlechteste = linien[0]!;
  for (const l of linien) {
    if (l.kpis.oee > beste.kpis.oee) beste = l;
    if (l.kpis.oee < schlechteste.kpis.oee) schlechteste = l;
  }
  return {
    linien,
    durchschnittOee: linien.reduce((sum, l) => sum + l.kpis.oee, 0) / linien.length,
    totalUnits: linien.reduce((sum, l) => sum + l.totalUnits, 0),
    goodUnits: linien.reduce((sum, l) => sum + l.snapshot.goodUnits, 0),
    beste,
    schlechteste,
  };
}

/** Target OEE used for the plant view, same as the single-line view. */
export const LINIEN_ZIEL_OEE = SCHICHT_ZIEL.oee;

/** Worst station status on the line: Steht beats Warnung beats Läuft. */
export function linienKurzstatus(line: LinienSnapshot): Anlagenstatus {
  const stati = line.snapshot.stations.map((s) => s.status);
  if (stati.includes("steht")) return "steht";
  if (stati.includes("warnung")) return "warnung";
  return "laeuft";
}
