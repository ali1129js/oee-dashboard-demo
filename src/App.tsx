import { AppHeader } from "@/components/AppHeader";
import { useSimulationClock } from "@/hooks/useSimulationClock";
import { useTheme } from "@/hooks/useTheme";
import { DEMO_NOW_MIN } from "@/lib/types";
import { Uebersicht } from "@/pages/Uebersicht";

export function App() {
  const { theme, toggle } = useTheme();
  const clock = useSimulationClock(DEMO_NOW_MIN);

  return (
    <div className="app">
      <a className="skip-link" href="#inhalt">
        Zum Inhalt
      </a>
      <AppHeader theme={theme} onToggleTheme={toggle} />
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
