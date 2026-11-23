import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { baueHistorie } from "@/lib/historie";
import { alsProzent } from "@/lib/oee";
import { DEMO_DATUM, DEMO_NOW_MIN, DEMO_SEED, SHIFT_START_MIN } from "@/lib/types";
import { Historie } from "@/pages/Historie";

const THEME = "khaki" as const;

function zeileMitDatum(tabelle: HTMLElement, datum: string): HTMLElement {
  const zeile = within(tabelle).getByText(datum).closest("tr");
  if (!zeile) throw new Error(`Keine Zeile für ${datum}`);
  return zeile;
}

describe("Historie page", () => {
  it("lists the seeded past shifts and opens one shift's KPIs", async () => {
    const user = userEvent.setup();
    const serie = baueHistorie({ seed: DEMO_SEED, bezugsdatum: DEMO_DATUM, anzahl: 7 });
    render(<Historie theme={THEME} serie={serie} />);

    expect(screen.getByRole("heading", { name: "Historie" })).toBeInTheDocument();
    const tabelle = screen.getByLabelText("Tabelle der vergangenen Schichten");
    for (const schicht of serie) {
      const zeile = zeileMitDatum(tabelle, schicht.datum);
      expect(
        within(zeile).getByText(`${alsProzent(schicht.kpis.oee)}%`)
      ).toBeInTheDocument();
      expect(
        within(zeile).getByText(`${alsProzent(schicht.kpis.verfuegbarkeit)}%`)
      ).toBeInTheDocument();
      expect(
        within(zeile).getByText(`${alsProzent(schicht.kpis.leistung)}%`)
      ).toBeInTheDocument();
      expect(
        within(zeile).getByText(`${alsProzent(schicht.kpis.qualitaet)}%`)
      ).toBeInTheDocument();
      expect(
        within(zeile).getByText(String(schicht.snapshot.totalUnits))
      ).toBeInTheDocument();
    }

    const aelteste = serie[0]!;
    await user.click(
      within(zeileMitDatum(tabelle, aelteste.datum)).getByRole("button", {
        name: "Kennzahlen",
      })
    );

    const detail = screen.getByLabelText(`Kennzahlen der Schicht vom ${aelteste.datum}`);
    expect(
      within(detail).getByRole("heading", { name: `Schicht vom ${aelteste.datum}` })
    ).toBeInTheDocument();
    const kpis = within(detail).getByLabelText(`Kennzahlen vom ${aelteste.datum}`);
    expect(
      within(kpis).getByLabelText(
        new RegExp(`OEE ${alsProzent(aelteste.kpis.oee)} Prozent`)
      )
    ).toBeInTheDocument();
    expect(
      within(kpis).getByLabelText(
        new RegExp(`Verfügbarkeit ${alsProzent(aelteste.kpis.verfuegbarkeit)} Prozent`)
      )
    ).toBeInTheDocument();
  });

  it("shows an empty state and no KPI detail when there are no shifts", () => {
    render(<Historie theme={THEME} serie={[]} />);
    expect(
      screen.getByText("Keine vergangenen Schichten vorhanden.")
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Tabelle der vergangenen Schichten")
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Kennzahlen der Schicht vom/)).not.toBeInTheDocument();
  });

  it("opens the single shift's KPIs when the series has one day", () => {
    const serie = baueHistorie({ seed: DEMO_SEED, bezugsdatum: DEMO_DATUM, anzahl: 1 });
    expect(serie).toHaveLength(1);
    render(<Historie theme={THEME} serie={serie} />);

    const schicht = serie[0]!;
    const tabelle = screen.getByLabelText("Tabelle der vergangenen Schichten");
    const zeilen = within(tabelle).getAllByRole("row");
    expect(zeilen).toHaveLength(2);
    const zeile = zeileMitDatum(tabelle, schicht.datum);
    expect(
      within(zeile).getByText(`${alsProzent(schicht.kpis.oee)}%`)
    ).toBeInTheDocument();

    const detail = screen.getByLabelText(`Kennzahlen der Schicht vom ${schicht.datum}`);
    expect(
      within(detail).getByLabelText(
        new RegExp(`OEE ${alsProzent(schicht.kpis.oee)} Prozent`)
      )
    ).toBeInTheDocument();
  });

  it("does not rewrite history when the simulation clock moves", () => {
    const serie = baueHistorie({ seed: DEMO_SEED, bezugsdatum: DEMO_DATUM, anzahl: 7 });
    const { rerender } = render(
      <Historie theme={THEME} nowMin={SHIFT_START_MIN} serie={serie} />
    );
    const tabelle = () => screen.getByLabelText("Tabelle der vergangenen Schichten");
    const vorher = tabelle().textContent;
    expect(vorher).toContain(serie[0]!.datum);
    expect(vorher).toContain(`${alsProzent(serie[0]!.kpis.oee)}%`);

    rerender(<Historie theme={THEME} nowMin={DEMO_NOW_MIN} serie={serie} />);
    expect(tabelle().textContent).toBe(vorher);
    for (const schicht of serie) {
      const zeile = zeileMitDatum(tabelle(), schicht.datum);
      expect(zeile).toHaveTextContent(`${alsProzent(schicht.kpis.oee)}%`);
      expect(zeile).toHaveTextContent(String(schicht.snapshot.totalUnits));
    }
  });
});
