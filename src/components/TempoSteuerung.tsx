import type { Speed } from "@/hooks/useSimulationClock";
import { formatUhrzeit } from "@/lib/zeit";

const SPEEDS: { value: Speed; label: string }[] = [
  { value: 0, label: "Pause" },
  { value: 1, label: "1x" },
  { value: 10, label: "10x" },
  { value: 60, label: "60x" },
];

type Props = {
  nowMin: number;
  speed: Speed;
  onSpeed: (s: Speed) => void;
  onReset: () => void;
};

export function TempoSteuerung({ nowMin, speed, onSpeed, onReset }: Props) {
  return (
    <div className="tempo">
      <p className="tempo__time">
        Simulierte Zeit: <strong>{formatUhrzeit(nowMin, true)}</strong>
      </p>
      <div
        className="segmented"
        role="radiogroup"
        aria-label="Simulationsgeschwindigkeit"
      >
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            type="button"
            className="segment"
            role="radio"
            aria-checked={speed === s.value}
            onClick={() => onSpeed(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button type="button" className="btn" onClick={onReset}>
        Zurücksetzen
      </button>
    </div>
  );
}
