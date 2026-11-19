import { colors, contrastPairs, contrastRatio } from "./colors";

describe("theme contrast", () => {
  it("meets WCAG AA (4.5:1) for every text pair", () => {
    for (const pair of contrastPairs) {
      const bg = colors[pair.theme][pair.bg];
      const fg = colors[pair.theme][pair.fg];
      const ratio = contrastRatio(bg, fg);
      expect(
        ratio,
        `${pair.theme} ${pair.fg} on ${pair.bg} (${fg} / ${bg})`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
