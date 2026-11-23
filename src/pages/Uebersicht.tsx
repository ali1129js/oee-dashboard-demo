import { useMemo } from "react";
import { Anlagenstatus } from "@/components/Anlagenstatus";
import { KpiKachel } from "@/components/KpiKachel";
import { OeeChart } from "@/components/OeeChart";
import { SimBanner } from "@/components/SimBanner";
import { Stillstandsgruende } from "@/components/Stillstandsgruende";
import { TempoSteuerung } from "@/components/TempoSteuerung";
import type { Speed } from "@/hooks/useSimulationClock";
import { buildShiftPlan, snapshotAt } from "@/lib/simulation";
import {
  DEMO_SEED,
  schichtNameLang,
  type SchichtId,
  type SchichtZiel,
} from "@/lib/types";
import { formatUhrzeit } from "@/lib/zeit";
import { colors, type ThemeName } from "@/theme/colors";

type Props = {
  nowMin: number;
  speed: Speed;
  onSpeed: (s: Speed) => void;
  onReset: () => void;
  theme: ThemeName;
  seed?: number;
  ziel?: SchichtZiel;
  schichtId?: SchichtId;
};

export function Uebersicht({
  nowMin,
  speed,
  onSpeed,
  onReset,
  theme,
  seed = DEMO_SEED,
  ziel,
  schichtId = "frueh",
}: Props) {
  const plan = useMemo(() => buildShiftPlan(seed, schichtId), [seed, schichtId]);
  const snap = useMemo(() => snapshotAt(plan, nowMin, ziel), [plan, nowMin, ziel]);
  const c = colors[theme];

  return (
    <main id="inhalt" className="page">
      <SimBanner />
      <TempoSteuerung
        nowMin={snap.nowMin}
        speed={speed}
        onSpeed={onSpeed}
        onReset={onReset}
      />

      <section className="kpi-grid" aria-label="Kennzahlen der Schicht">
        <KpiKachel
          label="Verfügbarkeit"
          value={snap.kpis.verfuegbarkeit}
          delta={snap.deltas.verfuegbarkeit}
          color={c.ringAvail}
        />
        <KpiKachel
          label="Leistung"
          value={snap.kpis.leistung}
          delta={snap.deltas.leistung}
          color={c.ringPerf}
        />
        <KpiKachel
          label="Qualität"
          value={snap.kpis.qualitaet}
          delta={snap.deltas.qualitaet}
          color={c.ringQual}
        />
        <KpiKachel
          label="OEE"
          hint="Gesamtanlageneffektivität"
          value={snap.kpis.oee}
          delta={snap.deltas.oee}
          color={c.ringOee}
        />
      </section>

      <OeeChart
        data={snap.oeeUeberSchicht}
        theme={theme}
        schichtLabel={`Schichtzeit: ${formatUhrzeit(plan.startMin)}-${formatUhrzeit(plan.endMin)}, ${schichtNameLang(schichtId)}`}
        startMin={plan.startMin}
        endMin={plan.endMin}
      />

      <div className="lower-grid">
        <Stillstandsgruende rows={snap.stillstaende} theme={theme} />
        <Anlagenstatus stations={snap.stations} nowMin={snap.nowMin} theme={theme} />
      </div>
    </main>
  );
}
