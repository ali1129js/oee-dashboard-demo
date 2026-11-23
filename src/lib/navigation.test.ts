import { describe, expect, it } from "vitest";
import { pageFromHash } from "./navigation";

describe("pageFromHash", () => {
  it("opens Linienübersicht and Historie for those hashes", () => {
    expect(pageFromHash("#linienuebersicht")).toBe("linienuebersicht");
    expect(pageFromHash("linienuebersicht")).toBe("linienuebersicht");
    expect(pageFromHash("#historie")).toBe("historie");
    expect(pageFromHash("historie")).toBe("historie");
  });

  it("falls back to Übersicht for empty, unknown, or later tabs", () => {
    expect(pageFromHash("")).toBe("uebersicht");
    expect(pageFromHash("#uebersicht")).toBe("uebersicht");
    expect(pageFromHash("#einstellungen")).toBe("uebersicht");
    expect(pageFromHash("#unbekannt")).toBe("uebersicht");
  });
});
