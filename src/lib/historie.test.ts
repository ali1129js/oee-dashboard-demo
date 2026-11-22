import { describe, expect, it } from "vitest";
import {
  arbeitstageVorher,
  baueHistorie,
  baueHistorienSchicht,
  formatDeDatum,
  istArbeitstag,
  mischeSchichtSeed,
  parseDeDatum,
} from "./historie";
import { DEMO_DATUM, DEMO_SEED, SHIFT_END_MIN, SHIFT_START_MIN } from "./types";

const BEZUG = parseDeDatum(DEMO_DATUM); // Thursday 19.11.2026

describe("arbeitstageVorher", () => {
  it("returns the last 7 weekdays before the demo date, oldest first, no weekends", () => {
    const tage = arbeitstageVorher(BEZUG, 7);
    expect(tage.map(formatDeDatum)).toEqual([
      "10.11.2026",
      "11.11.2026",
      "12.11.2026",
      "13.11.2026",
      "16.11.2026",
      "17.11.2026",
      "18.11.2026",
    ]);
    for (const t of tage) expect(istArbeitstag(t)).toBe(true);
  });

  it("skips the weekend when the reference day is a Monday", () => {
    // 16.11.2026 is a Monday; previous working day is Friday 13.11.
    expect(arbeitstageVorher(parseDeDatum("16.11.2026"), 1).map(formatDeDatum)).toEqual([
      "13.11.2026",
    ]);
  });

  it("treats a Sunday reference as before Friday", () => {
    expect(arbeitstageVorher(parseDeDatum("15.11.2026"), 1).map(formatDeDatum)).toEqual([
      "13.11.2026",
    ]);
  });

  it("returns an empty list for a non-positive count", () => {
    expect(arbeitstageVorher(BEZUG, 0)).toEqual([]);
    expect(arbeitstageVorher(BEZUG, -3)).toEqual([]);
  });
});

describe("baueHistorie", () => {
  const serie = baueHistorie({ seed: DEMO_SEED, bezugsdatum: DEMO_DATUM, anzahl: 7 });

  it("builds at least 7 Fruehschicht results from a frozen seed", () => {
    expect(serie).toHaveLength(7);
    for (const s of serie) {
      expect(s.plan.startMin).toBe(SHIFT_START_MIN);
      expect(s.plan.endMin).toBe(SHIFT_END_MIN);
      expect(s.snapshot.nowMin).toBe(SHIFT_END_MIN);
      expect(s.kpis).toEqual(s.snapshot.kpis);
    }
  });

  it("is deterministic for the same seed and reference day", () => {
    const nochmal = baueHistorie({
      seed: DEMO_SEED,
      bezugsdatum: DEMO_DATUM,
      anzahl: 7,
    });
    expect(nochmal).toEqual(serie);
  });

  it("changes the series when the seed changes", () => {
    const andere = baueHistorie({ seed: 1, bezugsdatum: DEMO_DATUM, anzahl: 7 });
    expect(andere.map((s) => s.seed)).not.toEqual(serie.map((s) => s.seed));
    expect(andere.map((s) => s.kpis.oee)).not.toEqual(serie.map((s) => s.kpis.oee));
  });

  it("gives each day a unique seed and never starts the OEE series at 0", () => {
    const seeds = new Set(serie.map((s) => s.seed));
    expect(seeds.size).toBe(serie.length);
    for (const s of serie) {
      expect(s.snapshot.oeeUeberSchicht.length).toBeGreaterThan(0);
      expect(s.snapshot.oeeUeberSchicht[0]!.oee).toBeGreaterThan(0);
      expect(s.kpis.oee).toBeGreaterThan(0);
      expect(s.snapshot.totalUnits).toBeGreaterThan(0);
    }
  });

  it("builds a single day and an empty series", () => {
    const eine = baueHistorie({ seed: DEMO_SEED, bezugsdatum: DEMO_DATUM, anzahl: 1 });
    expect(eine).toHaveLength(1);
    expect(eine[0]!.datum).toBe("18.11.2026");
    expect(baueHistorie({ anzahl: 0 })).toEqual([]);
  });

  it("rebuilds one shift the same way as the series", () => {
    const allein = baueHistorienSchicht(parseDeDatum("18.11.2026"), DEMO_SEED);
    expect(allein).toEqual(serie[6]);
    expect(mischeSchichtSeed(DEMO_SEED, parseDeDatum("18.11.2026"))).toBe(allein.seed);
  });
});
