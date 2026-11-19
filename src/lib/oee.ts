/**
 * Pure OEE math. Every input is a number; every output is in [0, 1].
 * No I/O, no Date, no Math.random — easy to test.
 *
 *   Verfuegbarkeit A = run / planned
 *   Leistung       P = (ideal cycle time x total units) / run
 *                  = total units / (run x ideal units per minute)
 *   Qualitaet      Q = good / total
 *   OEE              = A x P x Q
 *
 * The product matters: three "quite good" factors of 90% become 73%, not 90%.
 */
export function clamp01(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

/** n/d, or 0 when the denominator is not a positive finite number. */
export function ratio(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  if (!Number.isFinite(numerator / denominator)) return 0;
  return clamp01(numerator / denominator);
}

export type KennzahlenInput = {
  plannedMin: number;
  runMin: number;
  totalUnits: number;
  goodUnits: number;
  /** Ideal output while the line is actually running, in units per minute. */
  idealUnitsPerMin: number;
};

export type Kennzahlen = {
  verfuegbarkeit: number;
  leistung: number;
  qualitaet: number;
  oee: number;
};

export function berechneKennzahlen(input: KennzahlenInput): Kennzahlen {
  const plannedMin = finiteNonNeg(input.plannedMin);
  const runMin = Math.min(finiteNonNeg(input.runMin), plannedMin);
  const totalUnits = finiteNonNeg(input.totalUnits);
  const goodUnits = Math.min(finiteNonNeg(input.goodUnits), totalUnits);
  const idealUnitsPerMin = finiteNonNeg(input.idealUnitsPerMin);

  const verfuegbarkeit = ratio(runMin, plannedMin);
  const leistung = ratio(totalUnits, runMin * idealUnitsPerMin);
  const qualitaet = ratio(goodUnits, totalUnits);
  const oee = clamp01(verfuegbarkeit * leistung * qualitaet);
  return { verfuegbarkeit, leistung, qualitaet, oee };
}

export function alsProzent(anteil: number): number {
  return Math.round(clamp01(anteil) * 100);
}

/** Current minus baseline, in rounded percentage points. */
export function deltaProzentpunkte(aktuell: number, start: number): number {
  return alsProzent(aktuell) - alsProzent(start);
}

function finiteNonNeg(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}
