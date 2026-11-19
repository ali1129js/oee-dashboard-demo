import { clipIntervall, istAktiv, unionDauer } from "./intervalle";

describe("unionDauer", () => {
  it("returns 0 for an empty list or an empty window", () => {
    expect(unionDauer([], 0, 60)).toBe(0);
    expect(unionDauer([{ startMin: 10, durationMin: 5 }], 20, 20)).toBe(0);
  });

  it("counts a single clipped interval", () => {
    expect(unionDauer([{ startMin: 50, durationMin: 20 }], 0, 60)).toBe(10);
  });

  it("merges overlapping intervals once", () => {
    const a = { startMin: 10, durationMin: 20 };
    const b = { startMin: 20, durationMin: 20 };
    expect(unionDauer([a, b], 0, 100)).toBe(30);
  });

  it("adds disjoint intervals", () => {
    const a = { startMin: 10, durationMin: 10 };
    const b = { startMin: 30, durationMin: 10 };
    expect(unionDauer([a, b], 0, 100)).toBe(20);
  });
});

describe("clipIntervall and istAktiv", () => {
  it("clips to the window and rejects misses", () => {
    expect(clipIntervall({ startMin: 10, durationMin: 10 }, 15, 40)).toEqual({
      startMin: 15,
      endMin: 20,
    });
    expect(clipIntervall({ startMin: 10, durationMin: 5 }, 20, 40)).toBeNull();
  });

  it("treats the end of a stop as no longer active", () => {
    const s = { startMin: 10, durationMin: 5 };
    expect(istAktiv(s, 10)).toBe(true);
    expect(istAktiv(s, 14.9)).toBe(true);
    expect(istAktiv(s, 15)).toBe(false);
  });
});
