import { z } from "zod";
import { DEMO_SEED, SCHICHT_ZIEL, type SchichtZiel } from "./types";

export const EINSTELLUNGEN_KEY = "oee-dashboard-demo.settings";

export const TEMPO_OPTIONEN = [0, 1, 10, 60] as const;
export type Tempo = (typeof TEMPO_OPTIONEN)[number];

export type Einstellungen = {
  seed: number;
  defaultSpeed: Tempo;
  schichtZiel: SchichtZiel;
};

const SchichtZielSchema = z.object({
  verfuegbarkeit: z.number().finite().gte(0).lte(1),
  leistung: z.number().finite().gte(0).lte(1),
  qualitaet: z.number().finite().gte(0).lte(1),
  oee: z.number().finite().gte(0).lte(1),
});

export const EinstellungenSchema = z.object({
  seed: z.number().int().gte(0).lte(0xffff_ffff),
  defaultSpeed: z.union([z.literal(0), z.literal(1), z.literal(10), z.literal(60)]),
  schichtZiel: SchichtZielSchema,
});

export const DEMO_EINSTELLUNGEN: Einstellungen = {
  seed: DEMO_SEED,
  defaultSpeed: 0,
  schichtZiel: {
    verfuegbarkeit: SCHICHT_ZIEL.verfuegbarkeit,
    leistung: SCHICHT_ZIEL.leistung,
    qualitaet: SCHICHT_ZIEL.qualitaet,
    oee: SCHICHT_ZIEL.oee,
  },
};

export function parseEinstellungen(input: unknown): Einstellungen | null {
  const result = EinstellungenSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function loadEinstellungen(
  storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage
): Einstellungen {
  try {
    const raw = storage?.getItem(EINSTELLUNGEN_KEY);
    if (!raw)
      return {
        ...DEMO_EINSTELLUNGEN,
        schichtZiel: { ...DEMO_EINSTELLUNGEN.schichtZiel },
      };
    const parsed = parseEinstellungen(JSON.parse(raw));
    return parsed
      ? parsed
      : { ...DEMO_EINSTELLUNGEN, schichtZiel: { ...DEMO_EINSTELLUNGEN.schichtZiel } };
  } catch {
    return { ...DEMO_EINSTELLUNGEN, schichtZiel: { ...DEMO_EINSTELLUNGEN.schichtZiel } };
  }
}

export function saveEinstellungen(
  value: Einstellungen,
  storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage
): Einstellungen {
  const parsed = parseEinstellungen(value);
  if (!parsed) {
    throw new Error("Ungueltige Einstellungen");
  }
  try {
    storage?.setItem(EINSTELLUNGEN_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore write errors (private mode) */
  }
  return parsed;
}

export function resetEinstellungen(
  storage: Pick<Storage, "removeItem"> | undefined = globalThis.localStorage
): Einstellungen {
  try {
    storage?.removeItem(EINSTELLUNGEN_KEY);
  } catch {
    /* ignore */
  }
  return { ...DEMO_EINSTELLUNGEN, schichtZiel: { ...DEMO_EINSTELLUNGEN.schichtZiel } };
}

export type FormularFehler = {
  seed?: string;
  defaultSpeed?: string;
  verfuegbarkeit?: string;
  leistung?: string;
  qualitaet?: string;
  oee?: string;
};

export type EinstellungenFormular = {
  seed: string;
  defaultSpeed: Tempo;
  verfuegbarkeit: string;
  leistung: string;
  qualitaet: string;
  oee: string;
};

export function einstellungenZuFormular(value: Einstellungen): EinstellungenFormular {
  return {
    seed: String(value.seed),
    defaultSpeed: value.defaultSpeed,
    verfuegbarkeit: anteilZuProzentfeld(value.schichtZiel.verfuegbarkeit),
    leistung: anteilZuProzentfeld(value.schichtZiel.leistung),
    qualitaet: anteilZuProzentfeld(value.schichtZiel.qualitaet),
    oee: anteilZuProzentfeld(value.schichtZiel.oee),
  };
}

export function formularZuEinstellungen(
  form: EinstellungenFormular
): { ok: true; value: Einstellungen } | { ok: false; errors: FormularFehler } {
  const errors: FormularFehler = {};
  const seed = parseSeed(form.seed);
  if (seed === null) {
    errors.seed = "Bitte eine ganze nicht-negative 32-Bit-Zahl eingeben.";
  }
  if (!(TEMPO_OPTIONEN as readonly number[]).includes(form.defaultSpeed)) {
    errors.defaultSpeed = "Bitte Pause, 1x, 10x oder 60x wählen.";
  }
  const verfuegbarkeit = parseProzentfeld(form.verfuegbarkeit);
  const leistung = parseProzentfeld(form.leistung);
  const qualitaet = parseProzentfeld(form.qualitaet);
  const oee = parseProzentfeld(form.oee);
  if (verfuegbarkeit === null) errors.verfuegbarkeit = PROZENT_FEHLER;
  if (leistung === null) errors.leistung = PROZENT_FEHLER;
  if (qualitaet === null) errors.qualitaet = PROZENT_FEHLER;
  if (oee === null) errors.oee = PROZENT_FEHLER;

  if (
    seed === null ||
    verfuegbarkeit === null ||
    leistung === null ||
    qualitaet === null ||
    oee === null ||
    errors.defaultSpeed
  ) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      seed,
      defaultSpeed: form.defaultSpeed,
      schichtZiel: { verfuegbarkeit, leistung, qualitaet, oee },
    },
  };
}

const PROZENT_FEHLER = "Bitte einen Wert von 0 bis 100 eingeben.";

function anteilZuProzentfeld(anteil: number): string {
  const pct = Math.round(anteil * 1000) / 10;
  return Number.isInteger(pct) ? String(pct) : String(pct);
}

function parseSeed(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0 || n > 0xffff_ffff) return null;
  return n;
}

function parseProzentfeld(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 10) / 1000;
}
