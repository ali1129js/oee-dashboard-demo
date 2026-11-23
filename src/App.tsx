import { AppHeader } from "@/components/AppHeader";
import { useHashPage } from "@/hooks/useHashPage";
import { useMotion } from "@/hooks/useMotion";
import { useSimulationClock } from "@/hooks/useSimulationClock";
import { useTheme } from "@/hooks/useTheme";
import { DEMO_NOW_MIN } from "@/lib/types";
import { Historie } from "@/pages/Historie";
import { Linienuebersicht } from "@/pages/Linienuebersicht";
import { Uebersicht } from "@/pages/Uebersicht";

export function App() {
  const { theme, setTheme } = useTheme();
  const { motion, setMotion, reducedMotion } = useMotion();
  const clock = useSimulationClock(DEMO_NOW_MIN);
  const { page } = useHashPage();

  return (
    <div className="app">
      <a className="skip-link" href="#inhalt">
        Zum Inhalt
      </a>
      <AppHeader
        page={page}
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
        />
      ) : page === "historie" ? (
        <Historie theme={theme} nowMin={clock.nowMin} />
      ) : (
        <Uebersicht
          nowMin={clock.nowMin}
          speed={clock.speed}
          onSpeed={clock.setSpeed}
          onReset={clock.reset}
          theme={theme}
        />
      )}
    </div>
  );
}
