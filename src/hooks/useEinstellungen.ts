import { useCallback, useState } from "react";
import {
  loadEinstellungen,
  resetEinstellungen,
  saveEinstellungen,
  type Einstellungen,
} from "@/lib/einstellungen";

export function useEinstellungen(): {
  einstellungen: Einstellungen;
  setEinstellungen: (next: Einstellungen) => void;
  resetToDemo: () => void;
} {
  const [einstellungen, setState] = useState<Einstellungen>(() => loadEinstellungen());

  const setEinstellungen = useCallback((next: Einstellungen) => {
    setState(saveEinstellungen(next));
  }, []);

  const resetToDemo = useCallback(() => {
    setState(resetEinstellungen());
  }, []);

  return { einstellungen, setEinstellungen, resetToDemo };
}
