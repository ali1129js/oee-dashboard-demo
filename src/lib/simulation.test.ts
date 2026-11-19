import { buildShiftPlan, snapshotAt } from "./simulation";
import { createRng } from "./rng";
import {
  ANLAGEN_STATI,
  BASELINE_MIN,
  DEMO_NOW_MIN,
  DEMO_SEED,
  SHIFT_END_MIN,
  SHIFT_START_MIN,
  STATION_IDS,
  STOP_REASONS,
} from "./types";
import { formatUhrzeit } from "./zeit";

describe("createRng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("differs across seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
});

describe("buildShiftPlan", () => {
  it("reproduces the same plan for the same seed", () => {
    expect(buildShiftPlan(DEMO_SEED)).toEqual(buildShiftPlan(DEMO_SEED));
  });

  it("builds all three stations and only known stop reasons", () => {
    const plan = buildShiftPlan(DEMO_SEED);
    expect(plan.stations.map((s) => s.id)).toEqual([...STATION_IDS]);
    expect(plan.startMin).toBe(SHIFT_START_MIN);
    expect(plan.endMin).toBe(SHIFT_END_MIN);
    for (const s of plan.stations) {
      expect(s.stops.length).toBeGreaterThan(0);
      for (const stop of s.stops) {
        expect(STOP_REASONS).toContain(stop.reason);
        expect(stop.startMin).toBeGreaterThanOrEqual(SHIFT_START_MIN);
        expect(stop.startMin + stop.durationMin).toBeLessThanOrEqual(
          SHIFT_END_MIN + 1e-9
        );
        expect(stop.durationMin).toBeGreaterThan(0);
      }
    }
  });

  it("changes when the seed changes", () => {
    const a = buildShiftPlan(1);
    const b = buildShiftPlan(99);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe("snapshotAt", () => {
  const plan = buildShiftPlan(DEMO_SEED);

  it("has no planned time at shift start", () => {
    const snap = snapshotAt(plan, SHIFT_START_MIN);
    expect(snap.plannedMin).toBe(0);
    expect(snap.runMin).toBe(0);
    expect(snap.totalUnits).toBe(0);
    expect(snap.kpis.oee).toBe(0);
    expect(snap.nowMin).toBe(SHIFT_START_MIN);
  });

  it("clamps times before the start and after the end", () => {
    expect(snapshotAt(plan, 0).nowMin).toBe(SHIFT_START_MIN);
    expect(snapshotAt(plan, 24 * 60).nowMin).toBe(SHIFT_END_MIN);
    expect(snapshotAt(plan, Number.NaN).nowMin).toBe(SHIFT_START_MIN);
  });

  it("uses the full 480 minutes at 14:00", () => {
    const snap = snapshotAt(plan, SHIFT_END_MIN);
    expect(snap.plannedMin).toBe(480);
    expect(snap.runMin).toBeGreaterThan(0);
    expect(snap.runMin).toBeLessThanOrEqual(480);
    expect(snap.totalUnits).toBeGreaterThan(0);
    expect(snap.goodUnits).toBeLessThanOrEqual(snap.totalUnits);
  });

  it("never returns NaN or values outside [0, 1] for KPIs", () => {
    for (const t of [
      SHIFT_START_MIN,
      BASELINE_MIN,
      DEMO_NOW_MIN,
      SHIFT_END_MIN,
      8 * 60 + 7,
    ]) {
      const snap = snapshotAt(plan, t);
      for (const k of [snap.kpis, snap.startKpis, ...snap.stations.map((s) => s.kpis)]) {
        for (const v of Object.values(k)) {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("grows planned time as the clock advances", () => {
    const a = snapshotAt(plan, 8 * 60);
    const b = snapshotAt(plan, 10 * 60);
    expect(b.plannedMin).toBeGreaterThan(a.plannedMin);
    expect(b.totalUnits).toBeGreaterThanOrEqual(a.totalUnits);
  });

  it("marks a station Steht only while a stop is active", () => {
    const station = plan.stations[0];
    expect(station).toBeDefined();
    const stop = station!.stops[0];
    expect(stop).toBeDefined();
    const mid = stop!.startMin + stop!.durationMin / 2;
    const after = stop!.startMin + stop!.durationMin + 0.01;
    expect(snapshotAt(plan, mid).stations[0]?.status).toBe("steht");
    expect(snapshotAt(plan, after).stations[0]?.status).not.toBe("steht");
  });

  it("uses only known status labels", () => {
    const snap = snapshotAt(plan, DEMO_NOW_MIN);
    for (const s of snap.stations) {
      expect(ANLAGEN_STATI).toContain(s.status);
      expect(s.sparkline.length).toBeGreaterThan(0);
    }
  });

  it("lists stillstands with counts and non-negative durations", () => {
    const snap = snapshotAt(plan, DEMO_NOW_MIN);
    expect(snap.stillstaende.length).toBeGreaterThan(0);
    for (const row of snap.stillstaende) {
      expect(STOP_REASONS).toContain(row.reason);
      expect(row.count).toBeGreaterThan(0);
      expect(row.durationMin).toBeGreaterThan(0);
    }
  });

  it("keeps deltas at 0 until the baseline time", () => {
    const early = snapshotAt(plan, SHIFT_START_MIN + 10);
    expect(early.deltas.oee).toBe(0);
    const later = snapshotAt(plan, DEMO_NOW_MIN);
    for (const v of Object.values(later.deltas)) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("builds an OEE series from 06:00 up to the current time", () => {
    const snap = snapshotAt(plan, DEMO_NOW_MIN);
    expect(snap.oeeUeberSchicht[0]?.label).toBe("06:00");
    expect(snap.oeeUeberSchicht.at(-1)?.minute).toBeCloseTo(DEMO_NOW_MIN, 5);
    expect(formatUhrzeit(DEMO_NOW_MIN)).toBe("13:45");
    expect(formatUhrzeit(DEMO_NOW_MIN, true)).toBe("13:45:00");
  });
});
