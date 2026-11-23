import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useEinstellungen } from "@/hooks/useEinstellungen";
import { useHashPage } from "@/hooks/useHashPage";
import { useMotion } from "@/hooks/useMotion";
import { useSimulationClock } from "@/hooks/useSimulationClock";
import { useTheme } from "@/hooks/useTheme";
import type { Einstellungen as EinstellungenWert } from "@/lib/einstellungen";
import { SCHICHTEN, schichtDemoNowMin, type SchichtId } from "@/lib/types";
import { Einstellungen } from "@/pages/Einstellungen";
import { Historie } from "@/pages/Historie";
import { Linienuebersicht } from "@/pages/Linienuebersicht";
import { Uebersicht } from "@/pages/Uebersicht";

export function App() {
  const { theme, setTheme } = useTheme();
  const { motion, setMotion, reducedMotion } = useMotion();
  const { einstellungen, setEinstellungen, resetToDemo } = useEinstellungen();
  const [schichtId, setSchichtId] = useState<SchichtId>("frueh");
  const fenster = SCHICHTEN[schichtId];
  const clock = useSimulationClock(
    schichtDemoNowMin(fenster.endMin),
    einstellungen.defaultSpeed,
    fenster.startMin,
    fenster.endMin
  );
  const { page } = useHashPage();

  function handleSave(next: EinstellungenWert) {
    const tempoNeu = next.defaultSpeed !== einstellungen.defaultSpeed;
    setEinstellungen(next);
    if (tempoNeu) clock.setSpeed(next.defaultSpeed);
  }

  function handleReset() {
    resetToDemo();
    clock.setSpeed(0);
  }

  function handleSchicht(id: SchichtId) {
    const next = SCHICHTEN[id];
    setSchichtId(id);
    clock.setFenster(next.startMin, next.endMin, schichtDemoNowMin(next.endMin));
  }

  return (
    <div className="app">
      <a className="skip-link" href="#inhalt">
        Zum Inhalt
      </a>
      <AppHeader
        page={page}
        schichtId={schichtId}
        onSchicht={handleSchicht}
        theme={theme}
        onTheme={setTheme}
        motion={motion}
        onMotion={setMotion}
        reducedMotion={reducedMotion}
      />
      {page === "linienuebersicht" ? (
        <Linienuebersicht
          nowMin={clock.nowMin}
          speed={clock.speed}
          onSpeed={clock.setSpeed}
          onReset={clock.reset}
          seed={einstellungen.seed}
          ziel={einstellungen.schichtZiel}
          schichtId={schichtId}
        />
      ) : page === "historie" ? (
        <Historie
          theme={theme}
          nowMin={clock.nowMin}
          seed={einstellungen.seed}
          ziel={einstellungen.schichtZiel}
        />
      ) : page === "einstellungen" ? (
        <Einstellungen
          einstellungen={einstellungen}
          onSave={handleSave}
          onReset={handleReset}
        />
      ) : (
        <Uebersicht
          nowMin={clock.nowMin}
          speed={clock.speed}
          onSpeed={clock.setSpeed}
          onReset={clock.reset}
          theme={theme}
          seed={einstellungen.seed}
          ziel={einstellungen.schichtZiel}
          schichtId={schichtId}
        />
      )}
    </div>
  );
}
