import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "@/App";
import { baueHistorie } from "@/lib/historie";
import { baueAlleLinienPlaene, linienKurzstatus, vergleicheLinien } from "@/lib/linien";
import { alsProzent } from "@/lib/oee";
import {
  DEMO_DATUM,
  DEMO_NOW_MIN,
  DEMO_SEED,
  SHIFT_START_MIN,
  STATUS_LABEL,
} from "@/lib/types";
import { Linienuebersicht } from "@/pages/Linienuebersicht";

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

describe("navigation", () => {
  it("starts on Übersicht and opens Linienübersicht from the nav", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("link", { name: "Übersicht" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByLabelText("Kennzahlen der Schicht")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Linienübersicht" }));
    expect(screen.getByRole("link", { name: "Linienübersicht" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("heading", { name: "Linienübersicht" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Kennzahlen der Schicht")).not.toBeInTheDocument();

    const v = vergleicheLinien(baueAlleLinienPlaene(), DEMO_NOW_MIN);
    const vergleich = screen.getByLabelText("Vergleich der Linien");
    expect(
      within(vergleich).getByText(`${alsProzent(v.durchschnittOee)}%`)
    ).toBeInTheDocument();
    expect(within(vergleich).getByText(v.beste!.name)).toBeInTheDocument();
    expect(within(vergleich).getByText(v.schlechteste!.name)).toBeInTheDocument();
    expect(within(vergleich).getByText(String(v.totalUnits))).toBeInTheDocument();

    for (const line of v.linien) {
      const card = screen.getByRole("article", { name: line.name });
      expect(within(card).getByText(line.untertitel)).toBeInTheDocument();
      expect(within(card).getByText(`${alsProzent(line.kpis.oee)}%`)).toBeInTheDocument();
      expect(
        within(card).getByText(`${alsProzent(line.kpis.verfuegbarkeit)}%`)
      ).toBeInTheDocument();
      expect(
        within(card).getByText(`${alsProzent(line.kpis.leistung)}%`)
      ).toBeInTheDocument();
      expect(
        within(card).getByText(`${alsProzent(line.kpis.qualitaet)}%`)
      ).toBeInTheDocument();
      expect(
        within(card).getByText(STATUS_LABEL[linienKurzstatus(line)])
      ).toBeInTheDocument();
    }

    await user.click(screen.getByRole("link", { name: "Übersicht" }));
    expect(screen.getByLabelText("Kennzahlen der Schicht")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Linienübersicht" })
    ).not.toBeInTheDocument();
  });

  it("lets the keyboard reach Linienübersicht via the nav link", async () => {
    const user = userEvent.setup();
    render(<App />);
    const link = screen.getByRole("link", { name: "Linienübersicht" });
    link.focus();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Linienübersicht" })).toBeInTheDocument();
  });
});

describe("Linienuebersicht clock", () => {
  it("updates the comparison figures when the simulated time changes", () => {
    const { rerender } = render(
      <Linienuebersicht
        nowMin={SHIFT_START_MIN}
        speed={0}
        onSpeed={() => undefined}
        onReset={() => undefined}
      />
    );
    const start = vergleicheLinien(baueAlleLinienPlaene(), SHIFT_START_MIN);
    expect(start.totalUnits).toBe(0);
    expect(
      within(screen.getByLabelText("Vergleich der Linien")).getByText("0")
    ).toBeInTheDocument();

    rerender(
      <Linienuebersicht
        nowMin={DEMO_NOW_MIN}
        speed={0}
        onSpeed={() => undefined}
        onReset={() => undefined}
      />
    );
    const later = vergleicheLinien(baueAlleLinienPlaene(), DEMO_NOW_MIN);
    expect(later.totalUnits).toBeGreaterThan(0);
    expect(
      within(screen.getByLabelText("Vergleich der Linien")).getByText(
        String(later.totalUnits)
      )
    ).toBeInTheDocument();
  });
});

describe("Historie navigation", () => {
  it("opens Historie from the nav and shows the seeded past shifts", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "Historie" }));
    expect(screen.getByRole("link", { name: "Historie" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("heading", { name: "Historie" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Kennzahlen der Schicht")).not.toBeInTheDocument();

    const serie = baueHistorie({ seed: DEMO_SEED, bezugsdatum: DEMO_DATUM, anzahl: 7 });
    const tabelle = screen.getByLabelText("Tabelle der vergangenen Schichten");
    for (const schicht of serie) {
      const zeile = within(tabelle).getByText(schicht.datum).closest("tr");
      expect(zeile).toBeTruthy();
      expect(
        within(zeile as HTMLElement).getByText(`${alsProzent(schicht.kpis.oee)}%`)
      ).toBeInTheDocument();
    }

    const neueste = serie[serie.length - 1]!;
    expect(
      screen.getByLabelText(`Kennzahlen der Schicht vom ${neueste.datum}`)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Übersicht" }));
    expect(screen.getByLabelText("Kennzahlen der Schicht")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Historie" })).not.toBeInTheDocument();
  });

  it("lets the keyboard reach Historie via the nav link", async () => {
    const user = userEvent.setup();
    render(<App />);
    const link = screen.getByRole("link", { name: "Historie" });
    link.focus();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Historie" })).toBeInTheDocument();
  });
});
