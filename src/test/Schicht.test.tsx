import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "@/App";
import { buildShiftPlan, snapshotAt } from "@/lib/simulation";
import { DEMO_SEED, SCHICHTEN, schichtDemoNowMin, schichtNameLang } from "@/lib/types";
import { formatUhrzeit } from "@/lib/zeit";

describe("shift picker", () => {
  it("lets the user pick Früh, Spät or Nacht and drives KPIs, chart and clock", async () => {
    const user = userEvent.setup();
    render(<App />);

    const gruppe = screen.getByRole("radiogroup", { name: "Schicht" });
    expect(screen.getByRole("radio", { name: "Früh" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText(/Simulierte Zeit:/)).toHaveTextContent("13:45:00");
    expect(screen.getByText("Schichtzeit: 06:00-14:00, Frühschicht")).toBeInTheDocument();

    for (const id of ["spaet", "nacht"] as const) {
      const fenster = SCHICHTEN[id];
      await user.click(screen.getByRole("radio", { name: fenster.name }));
      expect(screen.getByRole("radio", { name: fenster.name })).toHaveAttribute(
        "aria-checked",
        "true"
      );
      const now = schichtDemoNowMin(fenster.endMin);
      expect(screen.getByText(/Simulierte Zeit:/)).toHaveTextContent(
        formatUhrzeit(now, true)
      );
      expect(
        screen.getByText(
          `Schichtzeit: ${formatUhrzeit(fenster.startMin)}-${formatUhrzeit(fenster.endMin)}, ${schichtNameLang(id)}`
        )
      ).toBeInTheDocument();

      const snap = snapshotAt(buildShiftPlan(DEMO_SEED, id), now);
      expect(snap.oeeUeberSchicht[0]?.oee).toBeGreaterThan(0);
      expect(snap.nowMin).toBe(now);
    }

    await user.click(screen.getByRole("radio", { name: "Früh" }));
    expect(screen.getByText("Schichtzeit: 06:00-14:00, Frühschicht")).toBeInTheDocument();
    expect(gruppe).toBeInTheDocument();
  });
});
