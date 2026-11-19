import { useCallback, useEffect, useState } from "react";
import {
  applyMotion,
  initialMotion,
  persistMotion,
  prefersReducedMotion,
  type MotionName,
} from "@/theme/theme";

export function useMotion(): {
  motion: MotionName;
  setMotion: (m: MotionName) => void;
  reducedMotion: boolean;
} {
  const [motion, setMotionState] = useState<MotionName>(initialMotion);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReducedMotion(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    applyMotion(motion, document.documentElement, reducedMotion);
  }, [motion, reducedMotion]);

  const setMotion = useCallback((next: MotionName) => {
    persistMotion(next);
    setMotionState(next);
  }, []);

  return { motion, setMotion, reducedMotion };
}
