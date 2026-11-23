import { describe, expect, it } from "vitest";
import { pageFromHash } from "./navigation";

describe("pageFromHash", () => {
  it("opens Linienübersicht and Historie for those hashes", () => {
    expect(pageFromHash("#linienuebersicht")).toBe("linienuebersicht");
    expect(pageFromHash("linienuebersicht")).toBe("linienuebersicht");
    expect(pageFromHash("#historie")).toBe("historie");
    expect(pageFromHash("historie")).toBe("historie");
    expect(pageFromHash("#einstellungen")).toBe("einstellungen");
    expect(pageFromHash("einstellungen")).toBe("einstellungen");
  });

  it("falls back to Übersicht for empty or unknown hashes", () => {
    expect(pageFromHash("")).toBe("uebersicht");
    expect(pageFromHash("#uebersicht")).toBe("uebersicht");
    expect(pageFromHash("#unbekannt")).toBe("uebersicht");
  });
});
