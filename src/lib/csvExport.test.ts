import { describe, expect, it } from "vitest";
import { buildShiftPlan, snapshotAt } from "./simulation";
import { CSV_HEADER, buildShiftCsv, shiftCsvFilename, stopsBisJetzt } from "./csvExport";
import { DEMO_DATUM, DEMO_NOW_MIN, DEMO_SEED, SCHICHTEN } from "./types";

function csvBody(text: string): string[] {
  const body = text.startsWith("\uFEFF") ? text.slice(1) : text;
  return body.trimEnd().split("\n");
}

describe("shiftCsvFilename", () => {
  it("includes the demo date and the shift id", () => {
    expect(shiftCsvFilename("frueh")).toBe(`linie-3-demo-${DEMO_DATUM}-frueh.csv`);
    expect(shiftCsvFilename("spaet", "20.11.2026")).toBe(
      "linie-3-demo-20.11.2026-spaet.csv"
    );
    expect(shiftCsvFilename("nacht")).toContain("nacht");
    expect(shiftCsvFilename("nacht")).toContain(DEMO_DATUM);
  });
});

describe("buildShiftCsv", () => {
  it("writes a stable header and the current shift interval OEE, stops and station status", () => {
    const plan = buildShiftPlan(DEMO_SEED, "frueh");
    const snap = snapshotAt(plan, DEMO_NOW_MIN);
    const lines = csvBody(buildShiftCsv({ plan, snap, schichtId: "frueh" }));

    expect(lines[0]).toBe(CSV_HEADER);
    expect(lines[0]?.split(",")).toHaveLength(11);

    const intervalle = lines.filter((line) => line.startsWith("intervall,"));
    const stillstaende = lines.filter((line) => line.startsWith("stillstand,"));
    const stati = lines.filter((line) => line.startsWith("anlagenstatus,"));

    expect(intervalle).toHaveLength(snap.oeeUeberSchicht.length);
    expect(intervalle.length).toBeGreaterThan(0);
    expect(intervalle[0]).toContain(DEMO_DATUM);
    expect(intervalle[0]).toContain(SCHICHTEN.frueh.name);
    expect(intervalle.some((line) => line.includes(snap.oeeUeberSchicht[0]!.label))).toBe(
      true
    );

    const expectedStops = stopsBisJetzt(plan, snap.nowMin);
    expect(stillstaende).toHaveLength(expectedStops.length);
    expect(expectedStops.length).toBeGreaterThan(0);
    expect(stillstaende.some((line) => line.includes("Formatwechsel"))).toBe(true);
    expect(stillstaende.some((line) => line.includes("Blistermaschine"))).toBe(true);

    expect(stati).toHaveLength(snap.stations.length);
    expect(stati).toHaveLength(3);
    expect(stati.every((line) => /Läuft|Warnung|Steht/.test(line))).toBe(true);
    expect(stati.some((line) => line.includes("Kartonierer"))).toBe(true);
  });

  it("clips stops to the current clock and leaves later stops out", () => {
    const plan = buildShiftPlan(DEMO_SEED, "frueh");
    const early = snapshotAt(plan, plan.startMin + 30);
    const earlyStops = stopsBisJetzt(plan, early.nowMin);
    const lateStops = stopsBisJetzt(plan, DEMO_NOW_MIN);
    expect(earlyStops.length).toBeLessThan(lateStops.length);
    expect(earlyStops.every((stop) => stop.startMin < early.nowMin)).toBe(true);
    expect(
      earlyStops.every((stop) => stop.startMin + stop.durationMin <= early.nowMin + 1e-9)
    ).toBe(true);

    const earlyCsv = csvBody(buildShiftCsv({ plan, snap: early, schichtId: "frueh" }));
    expect(earlyCsv.filter((line) => line.startsWith("stillstand,"))).toHaveLength(
      earlyStops.length
    );
  });

  it("changes the Schicht column when the shift changes, and quotes commas", () => {
    const plan = buildShiftPlan(DEMO_SEED, "spaet");
    const snap = snapshotAt(plan, plan.endMin - 15);
    const lines = csvBody(buildShiftCsv({ plan, snap, schichtId: "spaet" }));
    expect(
      lines.filter((line) => line.includes(`,${SCHICHTEN.spaet.name},`)).length
    ).toBe(lines.length - 1);
    expect(lines.some((line) => line.includes(SCHICHTEN.frueh.name))).toBe(false);

    const quoted = buildShiftCsv({
      plan,
      snap: {
        ...snap,
        oeeUeberSchicht: [{ minute: 900, label: "15:00, Mitte", oee: 80 }],
      },
      schichtId: "spaet",
      datum: "date,with,comma",
    });
    expect(quoted).toContain('"date,with,comma"');
    expect(quoted).toContain('"15:00, Mitte"');
  });
});
