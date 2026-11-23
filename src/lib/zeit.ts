import { SHIFT_END_MIN, SHIFT_START_MIN } from "./types";

export function clampZeit(
  minFromMidnight: number,
  startMin: number = SHIFT_START_MIN,
  endMin: number = SHIFT_END_MIN
): number {
  if (!Number.isFinite(minFromMidnight)) return startMin;
  return Math.min(endMin, Math.max(startMin, minFromMidnight));
}

export function formatUhrzeit(minFromMidnight: number, withSeconds = false): string {
  const total = Math.max(0, minFromMidnight);
  const h = Math.floor(total / 60) % 24;
  const m = Math.floor(total % 60);
  const s = Math.floor((total * 60) % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return withSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
}
