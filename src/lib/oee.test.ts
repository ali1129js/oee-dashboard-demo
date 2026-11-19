import {
  alsProzent,
  berechneKennzahlen,
  clamp01,
  deltaProzentpunkte,
  ratio,
} from "./oee";

describe("clamp01", () => {
  it("clamps below 0 and above 1", () => {
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(1.7)).toBe(1);
  });

  it("treats non-finite values as 0", () => {
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("ratio", () => {
  it("returns 0 when the denominator is 0, negative, or not finite", () => {
    expect(ratio(10, 0)).toBe(0);
    expect(ratio(10, -4)).toBe(0);
    expect(ratio(10, Number.NaN)).toBe(0);
    expect(ratio(Number.NaN, 4)).toBe(0);
  });

  it("clamps a result above 100%", () => {
    expect(ratio(12, 10)).toBe(1);
  });
});

describe("berechneKennzahlen", () => {
  it("returns all zeros when planned time is 0 (shift has not started)", () => {
    const k = berechneKennzahlen({
      plannedMin: 0,
      runMin: 0,
      totalUnits: 0,
      goodUnits: 0,
      idealUnitsPerMin: 10,
    });
    expect(k).toEqual({ verfuegbarkeit: 0, leistung: 0, qualitaet: 0, oee: 0 });
  });

  it("returns zeros when there is planned time but no run time", () => {
    const k = berechneKennzahlen({
      plannedMin: 60,
      runMin: 0,
      totalUnits: 0,
      goodUnits: 0,
      idealUnitsPerMin: 10,
    });
    expect(k.verfuegbarkeit).toBe(0);
    expect(k.leistung).toBe(0);
    expect(k.qualitaet).toBe(0);
    expect(k.oee).toBe(0);
  });

  it("returns Qualitaet 0 and Leistung 0 when units are zero despite run time", () => {
    const k = berechneKennzahlen({
      plannedMin: 60,
      runMin: 60,
      totalUnits: 0,
      goodUnits: 0,
      idealUnitsPerMin: 10,
    });
    expect(k.verfuegbarkeit).toBe(1);
    expect(k.leistung).toBe(0);
    expect(k.qualitaet).toBe(0);
    expect(k.oee).toBe(0);
  });

  it("returns 100% on a perfect shift", () => {
    const k = berechneKennzahlen({
      plannedMin: 60,
      runMin: 60,
      totalUnits: 600,
      goodUnits: 600,
      idealUnitsPerMin: 10,
    });
    expect(k.verfuegbarkeit).toBe(1);
    expect(k.leistung).toBe(1);
    expect(k.qualitaet).toBe(1);
    expect(k.oee).toBe(1);
  });

  it("clamps Leistung to 100% when output beats the ideal rate", () => {
    const k = berechneKennzahlen({
      plannedMin: 60,
      runMin: 60,
      totalUnits: 800,
      goodUnits: 800,
      idealUnitsPerMin: 10,
    });
    expect(k.leistung).toBe(1);
    expect(k.oee).toBe(1);
  });

  it("clamps Qualitaet and ignores good units above total", () => {
    const k = berechneKennzahlen({
      plannedMin: 60,
      runMin: 60,
      totalUnits: 100,
      goodUnits: 150,
      idealUnitsPerMin: 10,
    });
    expect(k.qualitaet).toBe(1);
  });

  it("caps run time at planned time", () => {
    const k = berechneKennzahlen({
      plannedMin: 60,
      runMin: 90,
      totalUnits: 600,
      goodUnits: 600,
      idealUnitsPerMin: 10,
    });
    expect(k.verfuegbarkeit).toBe(1);
  });

  it("treats negative and non-finite inputs as 0", () => {
    const k = berechneKennzahlen({
      plannedMin: -10,
      runMin: Number.NaN,
      totalUnits: Number.NEGATIVE_INFINITY,
      goodUnits: -3,
      idealUnitsPerMin: -1,
    });
    expect(k).toEqual({ verfuegbarkeit: 0, leistung: 0, qualitaet: 0, oee: 0 });
  });

  it("multiplies the three factors (90% x 90% x 90% is 72.9%, not 90%)", () => {
    const k = berechneKennzahlen({
      plannedMin: 100,
      runMin: 90,
      totalUnits: 810,
      goodUnits: 729,
      idealUnitsPerMin: 10,
    });
    expect(k.verfuegbarkeit).toBeCloseTo(0.9, 10);
    expect(k.leistung).toBeCloseTo(0.9, 10);
    expect(k.qualitaet).toBeCloseTo(0.9, 10);
    expect(k.oee).toBeCloseTo(0.729, 10);
  });

  it("matches the classic example A=92% P=85% Q=98%", () => {
    // 480 min planned, 441.6 run, ideal 10/min -> 3760 total at P=85%, 3684.8 good
    const plannedMin = 480;
    const runMin = 480 * 0.92;
    const ideal = 10;
    const totalUnits = runMin * ideal * 0.85;
    const goodUnits = totalUnits * 0.98;
    const k = berechneKennzahlen({
      plannedMin,
      runMin,
      totalUnits,
      goodUnits,
      idealUnitsPerMin: ideal,
    });
    expect(k.verfuegbarkeit).toBeCloseTo(0.92, 10);
    expect(k.leistung).toBeCloseTo(0.85, 10);
    expect(k.qualitaet).toBeCloseTo(0.98, 10);
    expect(k.oee).toBeCloseTo(0.92 * 0.85 * 0.98, 10);
    expect(alsProzent(k.oee)).toBe(77);
  });
});

describe("alsProzent and deltas", () => {
  it("rounds to whole percentage points", () => {
    expect(alsProzent(0.766)).toBe(77);
    expect(alsProzent(0.764)).toBe(76);
  });

  it("reports a signed percentage-point delta vs the start value", () => {
    expect(deltaProzentpunkte(0.8, 0.77)).toBe(3);
    expect(deltaProzentpunkte(0.7, 0.77)).toBe(-7);
    expect(deltaProzentpunkte(0.5, 0.5)).toBe(0);
  });
});
