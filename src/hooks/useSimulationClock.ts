import { useCallback, useEffect, useRef, useState } from "react";
import { SHIFT_END_MIN, SHIFT_START_MIN } from "@/lib/types";
import { clampZeit } from "@/lib/zeit";

export type Speed = 0 | 1 | 10 | 60;

/**
 * Simulated clock. Speed 1x means one simulated minute per real second,
 * so a full 8-hour shift takes eight minutes of wall time at 1x.
 * The interval is cleared on pause, unmount, or when the shift ends.
 */
export function useSimulationClock(
  initialMin: number,
  initialSpeed: Speed = 0,
  startMin: number = SHIFT_START_MIN,
  endMin: number = SHIFT_END_MIN
): {
  nowMin: number;
  speed: Speed;
  setSpeed: (s: Speed) => void;
  reset: () => void;
  setFenster: (startMin: number, endMin: number, nowMin: number) => void;
} {
  const [nowMin, setNowMin] = useState(() => clampZeit(initialMin, startMin, endMin));
  const [speed, setSpeedState] = useState<Speed>(initialSpeed);
  const speedRef = useRef<Speed>(0);
  speedRef.current = speed;
  const fensterRef = useRef({ startMin, endMin });

  const setSpeed = useCallback((s: Speed) => {
    setSpeedState(s);
  }, []);

  const setFenster = useCallback((start: number, end: number, now: number) => {
    fensterRef.current = { startMin: start, endMin: end };
    setNowMin(clampZeit(now, start, end));
  }, []);

  useEffect(() => {
    fensterRef.current = { startMin, endMin };
  }, [startMin, endMin]);

  useEffect(() => {
    if (speed === 0) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now();
      const dtSec = (t - last) / 1000;
      last = t;
      const factor = speedRef.current;
      if (factor === 0) return;
      const ende = fensterRef.current.endMin;
      setNowMin((prev) => {
        const next = prev + factor * dtSec;
        if (next >= ende) {
          setSpeedState(0);
          return ende;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [speed]);

  const reset = useCallback(() => {
    setSpeedState(0);
    setNowMin(fensterRef.current.startMin);
  }, []);

  return { nowMin, speed, setSpeed, reset, setFenster };
}
