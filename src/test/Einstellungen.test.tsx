import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "@/App";
import {
  DEMO_EINSTELLUNGEN,
  EINSTELLUNGEN_KEY,
  loadEinstellungen,
} from "@/lib/einstellungen";
import { buildShiftPlan, snapshotAt } from "@/lib/simulation";
import { DEMO_NOW_MIN, DEMO_SEED } from "@/lib/types";

async function oeffneEinstellungen(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("link", { name: "Einstellungen" }));
  expect(screen.getByRole("link", { name: "Einstellungen" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  expect(screen.getByRole("heading", { name: "Einstellungen" })).toBeInTheDocument();
}

describe("Einstellungen page", () => {
  it("persists a valid seed, tempo and Schichtziel, and Übersicht uses the new targets", async () => {
    const user = userEvent.setup();
    render(<App />);
    await oeffneEinstellungen(user);

    const seed = screen.getByLabelText("Demo-Seed");
    await user.clear(seed);
    await user.type(seed, "42");
    await user.click(screen.getByRole("radio", { name: "10x" }));
    const oeeZiel = screen.getByLabelText("OEE (%)");
    await user.clear(oeeZiel);
    await user.type(oeeZiel, "50");

    expect(loadEinstellungen()).toEqual(DEMO_EINSTELLUNGEN);
    await user.click(screen.getByRole("button", { name: "Übernehmen" }));

    const stored = loadEinstellungen();
    expect(stored.seed).toBe(42);
    expect(stored.defaultSpeed).toBe(10);
    expect(stored.schichtZiel.oee).toBe(0.5);
    expect(JSON.parse(localStorage.getItem(EINSTELLUNGEN_KEY) ?? "null")).toEqual(stored);
    expect(
      screen.getByText(/Gespeichert. Die Werte gelten für Übersicht/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Übersicht" }));
    const erwartetesDelta = snapshotAt(
      buildShiftPlan(42),
      DEMO_NOW_MIN,
      stored.schichtZiel
    ).deltas.oee;
    const kpis = screen.getByLabelText("Kennzahlen der Schicht");
    const oeeKachel = within(kpis).getByRole("article", { name: /^OEE / });
    const vorzeichen = erwartetesDelta > 0 ? "+" : "";
    expect(oeeKachel).toHaveTextContent(
      `${vorzeichen}${erwartetesDelta}% vs. Schichtziel`
    );
    const demoDelta = snapshotAt(buildShiftPlan(DEMO_SEED), DEMO_NOW_MIN).deltas.oee;
    expect(erwartetesDelta).not.toBe(demoDelta);
  });

  it("keeps stored values unchanged when the input is invalid", async () => {
    const user = userEvent.setup();
    render(<App />);
    await oeffneEinstellungen(user);

    const seed = screen.getByLabelText("Demo-Seed");
    await user.clear(seed);
    await user.type(seed, "12.5");
    await user.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /ganze nicht-negative 32-Bit-Zahl/
    );
    expect(loadEinstellungen()).toEqual(DEMO_EINSTELLUNGEN);
    expect(localStorage.getItem(EINSTELLUNGEN_KEY)).toBeNull();

    await user.clear(seed);
    await user.type(seed, "9");
    const leistung = screen.getByLabelText("Leistung (%)");
    await user.clear(leistung);
    await user.type(leistung, "101");
    await user.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/0 bis 100/);
    expect(loadEinstellungen()).toEqual(DEMO_EINSTELLUNGEN);
  });

  it("resets to the demo values and clears storage", async () => {
    const user = userEvent.setup();
    render(<App />);
    await oeffneEinstellungen(user);
    const seed = screen.getByLabelText("Demo-Seed");
    await user.clear(seed);
    await user.type(seed, "7");
    await user.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(loadEinstellungen().seed).toBe(7);

    await user.click(screen.getByRole("button", { name: "Zurück auf Demo" }));
    expect(loadEinstellungen()).toEqual(DEMO_EINSTELLUNGEN);
    expect(localStorage.getItem(EINSTELLUNGEN_KEY)).toBeNull();
    expect(screen.getByLabelText("Demo-Seed")).toHaveValue(String(DEMO_SEED));
    expect(screen.getByText("Demo-Werte wiederhergestellt.")).toBeInTheDocument();
  });

  it("lets the keyboard reach Einstellungen via the nav link", async () => {
    const user = userEvent.setup();
    render(<App />);
    const link = screen.getByRole("link", { name: "Einstellungen" });
    link.focus();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Einstellungen" })).toBeInTheDocument();
  });
});
