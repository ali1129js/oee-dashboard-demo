import { alsProzent } from "@/lib/oee";
import { STATUS_LABEL, type StationSnapshot } from "@/lib/types";
import { formatUhrzeit } from "@/lib/zeit";
import { colors, type ThemeName } from "@/theme/colors";
import { Sparkline } from "./Sparkline";

type Props = {
  stations: StationSnapshot[];
  nowMin: number;
  theme: ThemeName;
};

export function Anlagenstatus({ stations, nowMin, theme }: Props) {
  const c = colors[theme];
  const colorFor = (status: StationSnapshot["status"]) =>
    status === "laeuft"
      ? c.statusRun
      : status === "warnung"
        ? c.statusWarn
        : c.statusStop;

  return (
    <section className="card status-card" aria-label="Anlagenstatus, Live">
      <header className="card__head">
        <h2>Anlagenstatus (Live)</h2>
        <p className="status-card__updated">
          <span className="status-dot status-dot--live" aria-hidden="true" />
          Aktualisiert:{" "}
          <time dateTime={formatUhrzeit(nowMin, true)}>
            {formatUhrzeit(nowMin, true)}
          </time>
        </p>
      </header>
      <div className="status-table-wrap">
        <table className="status-table">
          <thead>
            <tr>
              <th scope="col">Station</th>
              <th scope="col">Status</th>
              <th scope="col">OEE</th>
              <th scope="col">Verlauf</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => {
              const col = colorFor(s.status);
              return (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>
                    <span className={`status-pill status-pill--${s.status}`}>
                      <span
                        className="status-dot"
                        style={{ background: "currentColor" }}
                        aria-hidden="true"
                      />
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="status-table__oee">OEE: {alsProzent(s.oee)}%</td>
                  <td>
                    <Sparkline
                      values={s.sparkline}
                      color={col}
                      label={`OEE-Verlauf ${s.name}, aktuell ${alsProzent(s.oee)} Prozent`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
