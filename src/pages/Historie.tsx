import { useMemo, useState } from "react";
import { KpiKachel } from "@/components/KpiKachel";
import { OeeChart } from "@/components/OeeChart";
import { SimBanner } from "@/components/SimBanner";
import { Stillstandsgruende } from "@/components/Stillstandsgruende";
import { baueHistorie, type HistorienSchicht } from "@/lib/historie";
import type { SchichtZiel } from "@/lib/types";
import { alsProzent } from "@/lib/oee";
import { colors, type ThemeName } from "@/theme/colors";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  theme: ThemeName;
  /** Accepted so tests can prove the simulation clock does not rewrite history. */
  nowMin?: number;
  /** Override the seeded series (empty and single-day cases in tests). */
  serie?: HistorienSchicht[];
  seed?: number;
  ziel?: SchichtZiel;
};

export function Historie({ theme, serie, seed, ziel }: Props) {
  const historie = useMemo(
    () => serie ?? baueHistorie({ seed, ziel }),
    [serie, seed, ziel]
  );
  const newestIso = historie.at(-1)?.isoDatum ?? null;
  const [auswahlIso, setAuswahlIso] = useState<string | null>(newestIso);
  const ausgewaehlt =
    historie.find((s) => s.isoDatum === auswahlIso) ?? historie.at(-1) ?? null;
  const c = colors[theme];
  const chartData = historie.map((s) => ({
    isoDatum: s.isoDatum,
    datum: s.datum,
    oee: Math.round(s.kpis.oee * 1000) / 10,
  }));

  return (
    <main id="inhalt" className="page">
      <SimBanner />

      <header className="page-head">
        <h1 className="page-title">Historie</h1>
        <p className="page-lead">
          Abgeschlossene Frühschichten der letzten Arbeitstage vor dem Demotag. Die Werte
          sind fest und folgen nicht der Simulationsuhr.
        </p>
      </header>

      {historie.length === 0 ? (
        <p className="historie-empty" role="status">
          Keine vergangenen Schichten vorhanden.
        </p>
      ) : (
        <>
          <section className="card" aria-label="OEE der vergangenen Schichten">
            <header className="card__head">
              <h2>OEE der vergangenen Frühschichten</h2>
              <p className="muted small">Eine Schicht je Arbeitstag, fest aus dem Seed</p>
            </header>
            <div className="chart-card__body">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={c.chartGrid} />
                  <XAxis
                    dataKey="datum"
                    tick={{ fill: c.muted, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: c.muted, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      color: c.text,
                    }}
                    formatter={(value) => {
                      const n = typeof value === "number" ? value : Number(value);
                      return [`${Number.isFinite(n) ? n.toFixed(1) : value} %`, "OEE"];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="oee"
                    name="OEE"
                    stroke={c.chartLine}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: c.chartLine, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card" aria-label="Tabelle der vergangenen Schichten">
            <div className="historie-table-wrap">
              <table className="historie-table">
                <thead>
                  <tr>
                    <th scope="col">Datum</th>
                    <th scope="col">Schicht</th>
                    <th scope="col">Verfügbarkeit</th>
                    <th scope="col">Leistung</th>
                    <th scope="col">Qualität</th>
                    <th scope="col">OEE</th>
                    <th scope="col">Stück</th>
                    <th scope="col">
                      <span className="sr-only">Kennzahlen öffnen</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historie.map((schicht) => {
                    const offen = ausgewaehlt?.isoDatum === schicht.isoDatum;
                    return (
                      <tr
                        key={schicht.isoDatum}
                        className={offen ? "is-selected" : undefined}
                      >
                        <th scope="row">{schicht.datum}</th>
                        <td>Früh</td>
                        <td>{alsProzent(schicht.kpis.verfuegbarkeit)}%</td>
                        <td>{alsProzent(schicht.kpis.leistung)}%</td>
                        <td>{alsProzent(schicht.kpis.qualitaet)}%</td>
                        <td>{alsProzent(schicht.kpis.oee)}%</td>
                        <td>{schicht.snapshot.totalUnits}</td>
                        <td>
                          <button
                            type="button"
                            className="btn"
                            aria-pressed={offen}
                            onClick={() => setAuswahlIso(schicht.isoDatum)}
                          >
                            {offen ? "Geöffnet" : "Kennzahlen"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {ausgewaehlt ? <SchichtDetail schicht={ausgewaehlt} theme={theme} /> : null}
    </main>
  );
}

function SchichtDetail({
  schicht,
  theme,
}: {
  schicht: HistorienSchicht;
  theme: ThemeName;
}) {
  const c = colors[theme];
  return (
    <section
      className="historie-detail"
      aria-label={`Kennzahlen der Schicht vom ${schicht.datum}`}
    >
      <header className="page-head">
        <h2 className="page-title">Schicht vom {schicht.datum}</h2>
        <p className="page-lead">Frühschicht 06:00-14:00, fest am Schichtende.</p>
      </header>

      <section className="kpi-grid" aria-label={`Kennzahlen vom ${schicht.datum}`}>
        <KpiKachel
          label="Verfügbarkeit"
          value={schicht.kpis.verfuegbarkeit}
          delta={schicht.snapshot.deltas.verfuegbarkeit}
          color={c.ringAvail}
        />
        <KpiKachel
          label="Leistung"
          value={schicht.kpis.leistung}
          delta={schicht.snapshot.deltas.leistung}
          color={c.ringPerf}
        />
        <KpiKachel
          label="Qualität"
          value={schicht.kpis.qualitaet}
          delta={schicht.snapshot.deltas.qualitaet}
          color={c.ringQual}
        />
        <KpiKachel
          label="OEE"
          hint="Gesamtanlageneffektivität"
          value={schicht.kpis.oee}
          delta={schicht.snapshot.deltas.oee}
          color={c.ringOee}
        />
      </section>

      <OeeChart
        data={schicht.snapshot.oeeUeberSchicht}
        theme={theme}
        schichtLabel={`Schichtzeit: 06:00-14:00, Frühschicht am ${schicht.datum}`}
      />

      <Stillstandsgruende rows={schicht.snapshot.stillstaende} theme={theme} />
    </section>
  );
}
