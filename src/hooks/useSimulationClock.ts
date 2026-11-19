import { useCallback, useEffect, useRef, useState } from "react";
import { SHIFT_END_MIN, SHIFT_START_MIN } from "@/lib/types";
import { clampZeit } from "@/lib/zeit";

export type Speed = 0 | 1 | 10 | 60;

/**
 * Simulated clock. Speed 1x means one simulated minute per real second,
 * so a full 8-hour shift takes eight minutes of wall time at 1x.
 * The interval is cleared on pause, unmount, or when the shift ends.
 */
export function useSimulationClock(initialMin: number): {
  nowMin: number;
  speed: Speed;
  setSpeed: (s: Speed) => void;
  reset: () => void;
} {
  const [nowMin, setNowMin] = useState(() => clampZeit(initialMin));
  const [speed, setSpeedState] = useState<Speed>(0);
  const speedRef = useRef<Speed>(0);
  speedRef.current = speed;

  const setSpeed = useCallback((s: Speed) => {
    setSpeedState(s);
  }, []);

  useEffect(() => {
    if (speed === 0) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now();
      const dtSec = (t - last) / 1000;
      last = t;
      const factor = speedRef.current;
      if (factor === 0) return;
      setNowMin((prev) => {
        const next = prev + factor * dtSec;
        if (next >= SHIFT_END_MIN) {
          setSpeedState(0);
          return SHIFT_END_MIN;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [speed]);

  const reset = useCallback(() => {
    setSpeedState(0);
    setNowMin(SHIFT_START_MIN);
  }, []);

  return { nowMin, speed, setSpeed, reset };
}
