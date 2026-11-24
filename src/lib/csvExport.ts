import { formatUhrzeit } from "./zeit";
import {
  DEMO_DATUM,
  LINIE_NAME,
  SCHICHTEN,
  STATUS_LABEL,
  type SchichtId,
  type ShiftPlan,
  type ShiftSnapshot,
  type StopEvent,
} from "./types";

export const CSV_HEADER =
  "typ,datum,schicht,minute,uhrzeit,oee_prozent,station,status,grund,start_uhrzeit,dauer_min";

export type CsvShiftInput = {
  plan: ShiftPlan;
  snap: ShiftSnapshot;
  schichtId: SchichtId;
  datum?: string;
};

function csvField(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function csvRow(values: Array<string | number>): string {
  return values.map(csvField).join(",");
}

function formatDauer(min: number): string {
  const rounded = Math.round(min * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Stops that have already started at now, with duration clipped to the clock. */
export function stopsBisJetzt(plan: ShiftPlan, nowMin: number): StopEvent[] {
  const rows: StopEvent[] = [];
  for (const station of plan.stations) {
    for (const stop of station.stops) {
      if (stop.startMin >= nowMin) continue;
      const durationMin = Math.min(stop.durationMin, nowMin - stop.startMin);
      if (durationMin <= 0) continue;
      rows.push({ ...stop, durationMin });
    }
  }
  return rows.sort(
    (a, b) => a.startMin - b.startMin || a.stationId.localeCompare(b.stationId)
  );
}

export function shiftCsvFilename(
  schichtId: SchichtId,
  datum: string = DEMO_DATUM
): string {
  const slug = LINIE_NAME.toLowerCase().replaceAll(" ", "-");
  return `${slug}-${datum}-${schichtId}.csv`;
}

export function buildShiftCsv({
  plan,
  snap,
  schichtId,
  datum = DEMO_DATUM,
}: CsvShiftInput): string {
  const schicht = SCHICHTEN[schichtId].name;
  const rows: string[] = [CSV_HEADER];

  for (const punkt of snap.oeeUeberSchicht) {
    rows.push(
      csvRow([
        "intervall",
        datum,
        schicht,
        punkt.minute,
        punkt.label,
        punkt.oee,
        "",
        "",
        "",
        "",
        "",
      ])
    );
  }

  for (const stop of stopsBisJetzt(plan, snap.nowMin)) {
    const station = plan.stations.find((item) => item.id === stop.stationId);
    rows.push(
      csvRow([
        "stillstand",
        datum,
        schicht,
        "",
        "",
        "",
        station?.name ?? stop.stationId,
        "",
        stop.reason,
        formatUhrzeit(stop.startMin),
        formatDauer(stop.durationMin),
      ])
    );
  }

  for (const station of snap.stations) {
    rows.push(
      csvRow([
        "anlagenstatus",
        datum,
        schicht,
        "",
        "",
        Math.round(station.oee * 1000) / 10,
        station.name,
        STATUS_LABEL[station.status],
        "",
        "",
        "",
      ])
    );
  }

  return `\uFEFF${rows.join("\n")}\n`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
