import { afterEach, describe, expect, it } from "vitest";
import {
  DEMO_EINSTELLUNGEN,
  EINSTELLUNGEN_KEY,
  einstellungenZuFormular,
  formularZuEinstellungen,
  loadEinstellungen,
  parseEinstellungen,
  resetEinstellungen,
  saveEinstellungen,
} from "./einstellungen";
import { DEMO_SEED, SCHICHT_ZIEL } from "./types";

function memoryStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => (k in data ? data[k]! : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
    data,
  };
}

afterEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(EINSTELLUNGEN_KEY);
  }
});

describe("parseEinstellungen", () => {
  it("accepts the demo values", () => {
    expect(parseEinstellungen(DEMO_EINSTELLUNGEN)).toEqual(DEMO_EINSTELLUNGEN);
  });

  it("rejects missing fields, wrong types, and out-of-range values", () => {
    expect(parseEinstellungen(null)).toBeNull();
    expect(parseEinstellungen("x")).toBeNull();
    expect(parseEinstellungen({ ...DEMO_EINSTELLUNGEN, seed: -1 })).toBeNull();
    expect(parseEinstellungen({ ...DEMO_EINSTELLUNGEN, seed: 1.5 })).toBeNull();
    expect(parseEinstellungen({ ...DEMO_EINSTELLUNGEN, defaultSpeed: 5 })).toBeNull();
    expect(
      parseEinstellungen({
        ...DEMO_EINSTELLUNGEN,
        schichtZiel: { ...SCHICHT_ZIEL, oee: 1.2 },
      })
    ).toBeNull();
    expect(
      parseEinstellungen({
        ...DEMO_EINSTELLUNGEN,
        schichtZiel: { ...SCHICHT_ZIEL, oee: "80" },
      })
    ).toBeNull();
  });
});

describe("loadEinstellungen and saveEinstellungen", () => {
  it("returns the demo defaults when nothing is stored", () => {
    expect(loadEinstellungen(memoryStore())).toEqual(DEMO_EINSTELLUNGEN);
  });

  it("round-trips a valid record", () => {
    const store = memoryStore();
    const next = {
      seed: 42,
      defaultSpeed: 10 as const,
      schichtZiel: {
        verfuegbarkeit: 0.85,
        leistung: 0.8,
        qualitaet: 0.97,
        oee: 0.7,
      },
    };
    expect(saveEinstellungen(next, store)).toEqual(next);
    expect(loadEinstellungen(store)).toEqual(next);
  });

  it("falls back to the demo defaults for corrupt or invalid storage", () => {
    expect(loadEinstellungen(memoryStore({ [EINSTELLUNGEN_KEY]: "{not json" }))).toEqual(
      DEMO_EINSTELLUNGEN
    );
    expect(
      loadEinstellungen(
        memoryStore({
          [EINSTELLUNGEN_KEY]: JSON.stringify({ seed: "bad" }),
        })
      )
    ).toEqual(DEMO_EINSTELLUNGEN);
    expect(
      loadEinstellungen(
        memoryStore({
          [EINSTELLUNGEN_KEY]: JSON.stringify({
            ...DEMO_EINSTELLUNGEN,
            defaultSpeed: 99,
          }),
        })
      )
    ).toEqual(DEMO_EINSTELLUNGEN);
  });

  it("reset clears storage and returns the demo values", () => {
    const store = memoryStore();
    saveEinstellungen({ ...DEMO_EINSTELLUNGEN, seed: 7, defaultSpeed: 60 }, store);
    expect(store.data[EINSTELLUNGEN_KEY]).toBeDefined();
    expect(resetEinstellungen(store)).toEqual(DEMO_EINSTELLUNGEN);
    expect(store.data[EINSTELLUNGEN_KEY]).toBeUndefined();
    expect(loadEinstellungen(store)).toEqual(DEMO_EINSTELLUNGEN);
    expect(DEMO_EINSTELLUNGEN.seed).toBe(DEMO_SEED);
  });
});

describe("formularZuEinstellungen", () => {
  it("parses the demo form and percent text", () => {
    const form = einstellungenZuFormular(DEMO_EINSTELLUNGEN);
    expect(form.seed).toBe(String(DEMO_SEED));
    expect(form.verfuegbarkeit).toBe("90");
    expect(form.leistung).toBe("90");
    expect(form.qualitaet).toBe("99");
    expect(form.oee).toBe("80");
    expect(formularZuEinstellungen(form)).toEqual({
      ok: true,
      value: DEMO_EINSTELLUNGEN,
    });
  });

  it("accepts a comma decimal and rejects invalid seed or percent input", () => {
    const base = einstellungenZuFormular(DEMO_EINSTELLUNGEN);
    expect(formularZuEinstellungen({ ...base, qualitaet: "99,5" })).toEqual({
      ok: true,
      value: {
        ...DEMO_EINSTELLUNGEN,
        schichtZiel: { ...DEMO_EINSTELLUNGEN.schichtZiel, qualitaet: 0.995 },
      },
    });
    const badSeed = formularZuEinstellungen({ ...base, seed: "12.3" });
    expect(badSeed.ok).toBe(false);
    if (!badSeed.ok) expect(badSeed.errors.seed).toMatch(/ganze/);
    const empty = formularZuEinstellungen({ ...base, oee: "" });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.errors.oee).toMatch(/0 bis 100/);
    const over = formularZuEinstellungen({ ...base, leistung: "101" });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.errors.leistung).toMatch(/0 bis 100/);
  });
});
