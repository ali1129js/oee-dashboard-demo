import { useMemo } from "react";
import { SimBanner } from "@/components/SimBanner";
import { TempoSteuerung } from "@/components/TempoSteuerung";
import type { Speed } from "@/hooks/useSimulationClock";
import {
  LINIEN,
  baueAlleLinienPlaene,
  linienKurzstatus,
  vergleicheLinien,
  type LinienSnapshot,
} from "@/lib/linien";
import { alsProzent } from "@/lib/oee";
import { DEMO_SEED, STATUS_LABEL, type SchichtZiel } from "@/lib/types";

type Props = {
  nowMin: number;
  speed: Speed;
  onSpeed: (s: Speed) => void;
  onReset: () => void;
  seed?: number;
  ziel?: SchichtZiel;
};

export function Linienuebersicht({
  nowMin,
  speed,
  onSpeed,
  onReset,
  seed = DEMO_SEED,
  ziel,
}: Props) {
  const plaene = useMemo(() => baueAlleLinienPlaene(LINIEN, seed), [seed]);
  const vergleich = useMemo(
    () => vergleicheLinien(plaene, nowMin, ziel),
    [plaene, nowMin, ziel]
  );

  return (
    <main id="inhalt" className="page">
      <SimBanner />
      <TempoSteuerung nowMin={nowMin} speed={speed} onSpeed={onSpeed} onReset={onReset} />

      <header className="page-head">
        <h1 className="page-title">Linienübersicht</h1>
        <p className="page-lead">
          Drei fiktive Linien von Northwind Pharma, zur gleichen Simulationszeit.
        </p>
      </header>

      <section className="plant-summary" aria-label="Vergleich der Linien">
        <div>
          <p className="plant-summary__label">Durchschnitt-OEE</p>
          <p className="plant-summary__value">{alsProzent(vergleich.durchschnittOee)}%</p>
        </div>
        <div>
          <p className="plant-summary__label">Beste Linie</p>
          <p className="plant-summary__value">{vergleich.beste?.name ?? "-"}</p>
        </div>
        <div>
          <p className="plant-summary__label">Schlechteste Linie</p>
          <p className="plant-summary__value">{vergleich.schlechteste?.name ?? "-"}</p>
        </div>
        <div>
          <p className="plant-summary__label">Stück gesamt</p>
          <p className="plant-summary__value">{vergleich.totalUnits}</p>
        </div>
      </section>

      <section className="line-grid" aria-label="Linien">
        {vergleich.linien.map((line) => (
          <LinienKarte
            key={line.id}
            line={line}
            istBeste={
              vergleich.beste?.id === line.id && vergleich.schlechteste?.id !== line.id
            }
            istSchlechteste={
              vergleich.schlechteste?.id === line.id && vergleich.beste?.id !== line.id
            }
          />
        ))}
      </section>
    </main>
  );
}

function LinienKarte({
  line,
  istBeste,
  istSchlechteste,
}: {
  line: LinienSnapshot;
  istBeste: boolean;
  istSchlechteste: boolean;
}) {
  const status = linienKurzstatus(line);
  const statusLabel = STATUS_LABEL[status];

  return (
    <article className="card line-card" aria-labelledby={`${line.id}-name`}>
      <header className="line-card__head">
        <div>
          <h2 id={`${line.id}-name`} className="line-card__name">
            {line.name}
          </h2>
          <p className="line-card__sub">{line.untertitel}</p>
        </div>
        <p className={`line-card__status is-${status}`}>{statusLabel}</p>
      </header>
      {(istBeste || istSchlechteste) && (
        <p className="line-card__tag">
          {istBeste ? "Beste Linie" : "Schlechteste Linie"}
        </p>
      )}
      <dl className="line-kpis">
        <div>
          <dt>OEE</dt>
          <dd>{alsProzent(line.kpis.oee)}%</dd>
        </div>
        <div>
          <dt>Verfügbarkeit</dt>
          <dd>{alsProzent(line.kpis.verfuegbarkeit)}%</dd>
        </div>
        <div>
          <dt>Leistung</dt>
          <dd>{alsProzent(line.kpis.leistung)}%</dd>
        </div>
        <div>
          <dt>Qualität</dt>
          <dd>{alsProzent(line.kpis.qualitaet)}%</dd>
        </div>
      </dl>
    </article>
  );
}
