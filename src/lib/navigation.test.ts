import { describe, expect, it } from "vitest";
import { pageFromHash } from "./navigation";

describe("pageFromHash", () => {
  it("opens Linienübersicht only for that hash", () => {
    expect(pageFromHash("#linienuebersicht")).toBe("linienuebersicht");
    expect(pageFromHash("linienuebersicht")).toBe("linienuebersicht");
  });

  it("falls back to Übersicht for empty, unknown, or later tabs", () => {
    expect(pageFromHash("")).toBe("uebersicht");
    expect(pageFromHash("#uebersicht")).toBe("uebersicht");
    expect(pageFromHash("#historie")).toBe("uebersicht");
    expect(pageFromHash("#einstellungen")).toBe("uebersicht");
  });
});
