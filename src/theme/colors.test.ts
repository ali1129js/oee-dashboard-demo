import { GLOSS, THEME_NAMES, colors, contrastMeets, contrastPairs } from "./colors";

describe("theme contrast", () => {
  it("meets WCAG AA (4.5:1) for every text pair in all three themes", () => {
    expect(THEME_NAMES).toEqual(["khaki", "darkgrey", "midnight"]);
    for (const pair of contrastPairs) {
      const bg = colors[pair.theme][pair.bg];
      const fg = colors[pair.theme][pair.fg];
      expect(
        contrastMeets(bg, fg, 4.5),
        `${pair.theme} ${pair.fg} on ${pair.bg} (${fg} / ${bg})`
      ).toBe(true);
    }
  });

  it("meets WCAG AA for official gloss fills", () => {
    const fills: Array<[string, string]> = [
      [GLOSS.cobalt, GLOSS.onCobalt],
      [GLOSS.pewter, GLOSS.onPewter],
      [GLOSS.jade, GLOSS.onJade],
      [GLOSS.garnet, GLOSS.onGarnet],
      [GLOSS.saffron, GLOSS.onSaffron],
      [GLOSS.lagoon, GLOSS.onLagoon],
    ];
    for (const [bg, fg] of fills) {
      expect(contrastMeets(bg, fg, 4.5), `${fg} on ${bg}`).toBe(true);
    }
  });
});
