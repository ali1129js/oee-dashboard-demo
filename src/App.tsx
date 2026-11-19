import { AppHeader } from "@/components/AppHeader";
import { useMotion } from "@/hooks/useMotion";
import { useSimulationClock } from "@/hooks/useSimulationClock";
import { useTheme } from "@/hooks/useTheme";
import { DEMO_NOW_MIN } from "@/lib/types";
import { Uebersicht } from "@/pages/Uebersicht";

export function App() {
  const { theme, setTheme } = useTheme();
  const { motion, setMotion, reducedMotion } = useMotion();
  const clock = useSimulationClock(DEMO_NOW_MIN);

  return (
    <div className="app">
      <a className="skip-link" href="#inhalt">
        Zum Inhalt
      </a>
      <AppHeader
        theme={theme}
        onTheme={setTheme}
        motion={motion}
        onMotion={setMotion}
        reducedMotion={reducedMotion}
      />
      <Uebersicht
        nowMin={clock.nowMin}
        speed={clock.speed}
        onSpeed={clock.setSpeed}
        onReset={clock.reset}
        theme={theme}
      />
    </div>
  );
}
