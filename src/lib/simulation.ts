import { berechneKennzahlen, deltaProzentpunkte, type Kennzahlen } from "./oee";
import { createRng, randRange } from "./rng";
import { istAktiv, unionDauer } from "./intervalle";
import {
  BASELINE_MIN,
  DEMO_SEED,
  SHIFT_END_MIN,
  SHIFT_START_MIN,
  STATION_IDS,
  SCHICHT_ZIEL,
  STATION_NAMEN,
  WARNUNG_OEE,
  type Anlagenstatus,
  type ShiftPlan,
  type ShiftSnapshot,
  type StationId,
  type StationPlan,
  type StationSnapshot,
  type StillstandSumme,
  type StopEvent,
  type StopReason,
} from "./types";
import { clampZeit, formatUhrzeit } from "./zeit";

/**
 * Base stop windows for a typical Fruehschicht. Seeded jitter moves start
 * and duration a little, so one seed is reproducible and still looks organic.
 * The late Serialisierung window is placed so 13:45 falls inside a stop.
 */
const BASIS_STOPPS: ReadonlyArray<{
  stationId: StationId;
  reason: StopReason;
  startMin: number;
  durationMin: number;
}> = [
  {
    stationId: "blistermaschine",
    reason: "Formatwechsel",
    startMin: 7 * 60 + 20,
    durationMin: 22,
  },
  {
    stationId: "blistermaschine",
    reason: "Formatwechsel",
    startMin: 9 * 60 + 50,
    durationMin: 10,
  },
  {
    stationId: "blistermaschine",
    reason: "Reinigung",
    startMin: 11 * 60 + 15,
    durationMin: 12,
  },
  {
    stationId: "kartonierer",
    reason: "Materialmangel",
    startMin: 7 * 60 + 22,
    durationMin: 12,
  },
  {
    stationId: "kartonierer",
    reason: "Störung Kartonierer",
    startMin: 9 * 60 + 50,
    durationMin: 22,
  },
  {
    stationId: "kartonierer",
    reason: "Formatwechsel",
    startMin: 8 * 60 + 40,
    durationMin: 8,
  },
  {
    stationId: "kartonierer",
    reason: "Materialmangel",
    startMin: 12 * 60 + 15,
    durationMin: 10,
  },
  {
    stationId: "serialisierung",
    reason: "Reinigung",
    startMin: 7 * 60 + 20,
    durationMin: 16,
  },
  {
    stationId: "serialisierung",
    reason: "Formatwechsel",
    startMin: 13 * 60 + 22,
    durationMin: 32,
  },
];

const STATION_BASIS: Record<
  StationId,
  { ideal: number; yield0: number; speed0: number }
> = {
  blistermaschine: { ideal: 12, yield0: 0.99, speed0: 0.97 },
  kartonierer: { ideal: 10.5, yield0: 0.985, speed0: 0.88 },
  serialisierung: { ideal: 11.5, yield0: 0.988, speed0: 0.95 },
};

export function buildShiftPlan(seed: number = DEMO_SEED): ShiftPlan {
  const rng = createRng(seed);
  const stations: StationPlan[] = STATION_IDS.map((id) => {
    const basis = STATION_BASIS[id];
    const stops: StopEvent[] = BASIS_STOPPS.filter((s) => s.stationId === id).map((s) => {
      const startJitter = randRange(rng, -6, 6);
      const durJitter = randRange(rng, 0.85, 1.15);
      let startMin = s.startMin + startJitter;
      let durationMin = s.durationMin * durJitter;
      startMin = Math.max(SHIFT_START_MIN, startMin);
      const maxEnd = SHIFT_END_MIN;
      durationMin = Math.max(4, Math.min(durationMin, maxEnd - startMin));
      return { stationId: id, reason: s.reason, startMin, durationMin };
    });
    return {
      id,
      name: STATION_NAMEN[id],
      idealUnitsPerMin: basis.ideal,
      qualityYield: clampRange(basis.yield0 + randRange(rng, -0.008, 0.008), 0.95, 0.999),
      speedFactor:
        id === "kartonierer"
          ? clampRange(basis.speed0 + randRange(rng, -0.02, 0.02), 0.85, 0.92)
          : clampRange(basis.speed0 + randRange(rng, -0.03, 0.03), 0.7, 1),
      stops,
    };
  });
  return { seed, startMin: SHIFT_START_MIN, endMin: SHIFT_END_MIN, stations };
}

export function snapshotAt(plan: ShiftPlan, nowInput: number): ShiftSnapshot {
  const nowMin = clampZeit(nowInput);
  const lineStops = plan.stations.flatMap((s) => s.stops);
  const line = streckenKennzahlen(plan, lineStops, nowMin);
  const startKpis =
    nowMin <= plan.startMin
      ? line.kpis
      : streckenKennzahlen(plan, lineStops, Math.min(nowMin, BASELINE_MIN)).kpis;

  const sampleEvery = 15;
  const oeeUeberSchicht = [];
  // Start at the first completed interval, not 06:00 where OEE is still 0.
  for (let t = plan.startMin + sampleEvery; t <= nowMin + 1e-9; t += sampleEvery) {
    const minute = Math.min(t, nowMin);
    const k = streckenKennzahlen(plan, lineStops, minute).kpis;
    oeeUeberSchicht.push({
      minute,
      label: formatUhrzeit(minute),
      oee: Math.round(k.oee * 1000) / 10,
    });
  }
  if (nowMin > plan.startMin && (nowMin - plan.startMin) % sampleEvery > 1e-9) {
    oeeUeberSchicht.push({
      minute: nowMin,
      label: formatUhrzeit(nowMin),
      oee: Math.round(line.kpis.oee * 1000) / 10,
    });
  }

  const stillstaende = summiereStillstaende(lineStops, plan.startMin, nowMin);
  const stations = plan.stations.map((s) => stationSnapshot(s, plan.startMin, nowMin));

  return {
    nowMin,
    plannedMin: line.plannedMin,
    runMin: line.runMin,
    totalUnits: line.totalUnits,
    goodUnits: line.goodUnits,
    kpis: line.kpis,
    startKpis,
    deltas:
      line.plannedMin <= 0
        ? { verfuegbarkeit: 0, leistung: 0, qualitaet: 0, oee: 0 }
        : {
            verfuegbarkeit: deltaProzentpunkte(
              line.kpis.verfuegbarkeit,
              SCHICHT_ZIEL.verfuegbarkeit
            ),
            leistung: deltaProzentpunkte(line.kpis.leistung, SCHICHT_ZIEL.leistung),
            qualitaet: deltaProzentpunkte(line.kpis.qualitaet, SCHICHT_ZIEL.qualitaet),
            oee: deltaProzentpunkte(line.kpis.oee, SCHICHT_ZIEL.oee),
          },
    oeeUeberSchicht,
    stillstaende,
    stations,
  };
}

function streckenKennzahlen(
  plan: ShiftPlan,
  lineStops: StopEvent[],
  atMin: number
): {
  plannedMin: number;
  runMin: number;
  totalUnits: number;
  goodUnits: number;
  kpis: Kennzahlen;
} {
  const plannedMin = Math.max(0, atMin - plan.startMin);
  const down = unionDauer(lineStops, plan.startMin, atMin);
  const runMin = Math.max(0, plannedMin - down);
  const idealBottleneck = Math.min(...plan.stations.map((s) => s.idealUnitsPerMin));
  const rateBottleneck = Math.min(
    ...plan.stations.map((s) => s.idealUnitsPerMin * s.speedFactor)
  );
  const yieldMin = Math.min(...plan.stations.map((s) => s.qualityYield));
  const totalUnits = Math.floor(runMin * rateBottleneck);
  const goodUnits = Math.floor(totalUnits * yieldMin);
  const kpis = berechneKennzahlen({
    plannedMin,
    runMin,
    totalUnits,
    goodUnits,
    idealUnitsPerMin: idealBottleneck,
  });
  return { plannedMin, runMin, totalUnits, goodUnits, kpis };
}

function stationSnapshot(
  station: StationPlan,
  startMin: number,
  nowMin: number
): StationSnapshot {
  const plannedMin = Math.max(0, nowMin - startMin);
  const down = unionDauer(station.stops, startMin, nowMin);
  const runMin = Math.max(0, plannedMin - down);
  const totalUnits = Math.floor(runMin * station.idealUnitsPerMin * station.speedFactor);
  const goodUnits = Math.floor(totalUnits * station.qualityYield);
  const kpis = berechneKennzahlen({
    plannedMin,
    runMin,
    totalUnits,
    goodUnits,
    idealUnitsPerMin: station.idealUnitsPerMin,
  });
  const activeStop = station.stops.find((s) => istAktiv(s, nowMin)) ?? null;
  const status: Anlagenstatus = activeStop
    ? "steht"
    : kpis.oee < WARNUNG_OEE
      ? "warnung"
      : "laeuft";

  const sparkline: number[] = [];
  const step = 15;
  for (let from = startMin; from < nowMin - 1e-9;) {
    const to = Math.min(from + step, nowMin);
    const planned = Math.max(0, to - from);
    const d = unionDauer(station.stops, from, to);
    const r = Math.max(0, planned - d);
    const tot = Math.floor(r * station.idealUnitsPerMin * station.speedFactor);
    const good = Math.floor(tot * station.qualityYield);
    sparkline.push(
      berechneKennzahlen({
        plannedMin: planned,
        runMin: r,
        totalUnits: tot,
        goodUnits: good,
        idealUnitsPerMin: station.idealUnitsPerMin,
      }).oee
    );
    from = to;
  }
  if (sparkline.length === 0) sparkline.push(kpis.oee);

  return {
    id: station.id,
    name: station.name,
    status,
    kpis,
    oee: kpis.oee,
    sparkline,
    activeStop,
  };
}

function summiereStillstaende(
  stops: StopEvent[],
  from: number,
  to: number
): StillstandSumme[] {
  const map = new Map<StopReason, { durationMin: number; count: number }>();
  for (const s of stops) {
    const start = Math.max(from, s.startMin);
    const end = Math.min(to, s.startMin + s.durationMin);
    if (end <= start) continue;
    const cur = map.get(s.reason) ?? { durationMin: 0, count: 0 };
    cur.durationMin += end - start;
    cur.count += 1;
    map.set(s.reason, cur);
  }
  return [...map.entries()]
    .map(([reason, v]) => ({
      reason,
      durationMin: Math.round(v.durationMin),
      count: v.count,
    }))
    .sort((a, b) => b.durationMin - a.durationMin || b.count - a.count);
}

function clampRange(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
