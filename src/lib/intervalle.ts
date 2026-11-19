export type Intervall = { startMin: number; durationMin: number };

/** Overlap of an interval with [from, to], or null if none. */
export function clipIntervall(
  interval: Intervall,
  from: number,
  to: number
): { startMin: number; endMin: number } | null {
  const start = Math.max(from, interval.startMin);
  const end = Math.min(to, interval.startMin + interval.durationMin);
  if (end <= start) return null;
  return { startMin: start, endMin: end };
}

/** Total covered minutes of possibly overlapping intervals inside [from, to]. */
export function unionDauer(intervals: Intervall[], from: number, to: number): number {
  if (to <= from) return 0;
  const clips = intervals
    .map((s) => clipIntervall(s, from, to))
    .filter((c): c is { startMin: number; endMin: number } => c !== null)
    .sort((a, b) => a.startMin - b.startMin);
  if (clips.length === 0) return 0;
  const first = clips[0];
  if (!first) return 0;
  let total = 0;
  let curS = first.startMin;
  let curE = first.endMin;
  for (let i = 1; i < clips.length; i++) {
    const n = clips[i];
    if (!n) continue;
    if (n.startMin <= curE) {
      curE = Math.max(curE, n.endMin);
    } else {
      total += curE - curS;
      curS = n.startMin;
      curE = n.endMin;
    }
  }
  total += curE - curS;
  return total;
}

export function istAktiv(interval: Intervall, atMin: number): boolean {
  return interval.startMin <= atMin && atMin < interval.startMin + interval.durationMin;
}
