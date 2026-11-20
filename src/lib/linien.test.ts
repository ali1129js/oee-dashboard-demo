import { describe, expect, it } from "vitest";
import { LINIEN, baueAlleLinienPlaene, baueLinienPlan, vergleicheLinien } from "./linien";
import { SHIFT_END_MIN, SHIFT_START_MIN } from "./types";

const plaene = baueAlleLinienPlaene();

describe("Linien data", () => {
  it("defines three fictional lines with unique ids and seeds", () => {
    expect(LINIEN).toHaveLength(3);
    expect(new Set(LINIEN.map((l) => l.id)).size).toBe(3);
    expect(new Set(LINIEN.map((l) => l.seed)).size).toBe(3);
    for (const l of LINIEN) expect(l.untertitel).toContain("Northwind Pharma");
  });

  it("builds three stations with stop plans inside the shift for each line", () => {
    for (const p of plaene) {
      expect(p.plan.stations).toHaveLength(3);
      for (const s of p.plan.stations) {
        expect(s.stops.length).toBeGreaterThan(0);
        for (const st of s.stops) {
          expect(st.startMin).toBeGreaterThanOrEqual(SHIFT_START_MIN);
          expect(st.startMin + st.durationMin).toBeLessThanOrEqual(SHIFT_END_MIN + 1e-9);
        }
      }
    }
  });

  it("is deterministic", () => {
    expect(baueLinienPlan(LINIEN[1]!)).toEqual(baueLinienPlan(LINIEN[1]!));
  });

  it("adds the extra stop of Linie 2 to the Kartonierer, in time order", () => {
    const k = plaene[1]!.plan.stations.find((s) => s.id === "kartonierer")!;
    const base = plaene[2]!.plan.stations.find((s) => s.id === "kartonierer")!;
    expect(k.stops.length).toBe(base.stops.length + 1);
    const starts = k.stops.map((s) => s.startMin);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });
});

describe("vergleicheLinien", () => {
  const v = vergleicheLinien(plaene, 13 * 60 + 45);

  it("totals units over the lines", () => {
    expect(v.linien).toHaveLength(3);
    expect(v.totalUnits).toBe(v.linien.reduce((s, l) => s + l.totalUnits, 0));
    expect(v.goodUnits).toBeLessThanOrEqual(v.totalUnits);
    expect(v.totalUnits).toBeGreaterThan(0);
  });

  it("averages OEE and keeps it between best and worst", () => {
    expect(v.durchschnittOee).toBeGreaterThanOrEqual(v.schlechteste!.kpis.oee);
    expect(v.durchschnittOee).toBeLessThanOrEqual(v.beste!.kpis.oee);
  });

  it("names a best and a worst line that really are the extremes", () => {
    const oees = v.linien.map((l) => l.kpis.oee);
    expect(v.beste!.kpis.oee).toBe(Math.max(...oees));
    expect(v.schlechteste!.kpis.oee).toBe(Math.min(...oees));
    expect(v.beste!.id).not.toBe(v.schlechteste!.id);
  });

  it("handles no lines and one line", () => {
    const leer = vergleicheLinien([]);
    expect(leer.beste).toBeNull();
    expect(leer.schlechteste).toBeNull();
    expect(leer.durchschnittOee).toBe(0);
    const eine = vergleicheLinien([plaene[0]!], 13 * 60 + 45);
    expect(eine.beste!.id).toBe(eine.schlechteste!.id);
  });

  it("reports zero output at shift start", () => {
    const start = vergleicheLinien(plaene, SHIFT_START_MIN);
    expect(start.totalUnits).toBe(0);
  });
});
