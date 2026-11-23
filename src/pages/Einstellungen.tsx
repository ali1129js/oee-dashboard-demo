import { useEffect, useId, useState } from "react";
import { SimBanner } from "@/components/SimBanner";
import type { Speed } from "@/hooks/useSimulationClock";
import {
  DEMO_EINSTELLUNGEN,
  TEMPO_OPTIONEN,
  einstellungenZuFormular,
  formularZuEinstellungen,
  type Einstellungen,
  type EinstellungenFormular,
  type FormularFehler,
} from "@/lib/einstellungen";

const TEMPO_LABEL: Record<Speed, string> = {
  0: "Pause",
  1: "1x",
  10: "10x",
  60: "60x",
};

type Props = {
  einstellungen: Einstellungen;
  onSave: (next: Einstellungen) => void;
  onReset: () => void;
};

export function Einstellungen({ einstellungen, onSave, onReset }: Props) {
  const [form, setForm] = useState<EinstellungenFormular>(() =>
    einstellungenZuFormular(einstellungen)
  );
  const [errors, setErrors] = useState<FormularFehler>({});
  const [hinweis, setHinweis] = useState<string | null>(null);
  const formId = useId();

  useEffect(() => {
    setForm(einstellungenZuFormular(einstellungen));
    setErrors({});
  }, [einstellungen]);

  function updateForm(next: EinstellungenFormular) {
    setForm(next);
    setHinweis(null);
    const parsed = formularZuEinstellungen(next);
    setErrors(parsed.ok ? {} : parsed.errors);
  }

  function handleSubmit() {
    const parsed = formularZuEinstellungen(form);
    if (parsed.ok) {
      setErrors({});
      onSave(parsed.value);
      setHinweis(
        "Gespeichert. Die Werte gelten für Übersicht, Linienübersicht und Historie."
      );
    } else {
      setErrors(parsed.errors);
      setHinweis(null);
    }
  }

  function handleReset() {
    onReset();
    setForm(einstellungenZuFormular(DEMO_EINSTELLUNGEN));
    setErrors({});
    setHinweis("Demo-Werte wiederhergestellt.");
  }

  return (
    <main id="inhalt" className="page">
      <SimBanner />
      <header className="page-head">
        <h1 className="page-title">Einstellungen</h1>
        <p className="page-lead">
          Seed, Standardtempo und Schichtziele für diese Demo. Die Werte bleiben in diesem
          Browser gespeichert und werden vor der Verwendung geprüft.
        </p>
      </header>

      <form
        className="card einstellungen-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <div className="einstellungen-field">
          <label htmlFor={`${formId}-seed`}>Demo-Seed</label>
          <p className="einstellungen-hint" id={`${formId}-seed-hint`}>
            Steuert den zufälligen, aber wiederholbaren Schichtplan.
          </p>
          <input
            id={`${formId}-seed`}
            name="seed"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={form.seed}
            aria-invalid={Boolean(errors.seed)}
            aria-describedby={
              errors.seed
                ? `${formId}-seed-error ${formId}-seed-hint`
                : `${formId}-seed-hint`
            }
            onChange={(e) => updateForm({ ...form, seed: e.target.value })}
          />
          {errors.seed ? (
            <p className="einstellungen-error" id={`${formId}-seed-error`} role="alert">
              {errors.seed}
            </p>
          ) : null}
        </div>

        <fieldset className="einstellungen-field">
          <legend>Standardtempo</legend>
          <p className="einstellungen-hint">Startgeschwindigkeit der Simulationsuhr.</p>
          <div className="segmented" role="radiogroup" aria-label="Standardtempo">
            {TEMPO_OPTIONEN.map((value) => (
              <button
                key={value}
                type="button"
                className="segment"
                role="radio"
                aria-checked={form.defaultSpeed === value}
                onClick={() => updateForm({ ...form, defaultSpeed: value })}
              >
                {TEMPO_LABEL[value]}
              </button>
            ))}
          </div>
          {errors.defaultSpeed ? (
            <p className="einstellungen-error" role="alert">
              {errors.defaultSpeed}
            </p>
          ) : null}
        </fieldset>

        <fieldset className="einstellungen-ziele">
          <legend>Schichtziel</legend>
          <p className="einstellungen-hint">
            Zielwerte in Prozent. Die Deltas auf der Übersicht beziehen sich darauf.
          </p>
          <div className="einstellungen-ziel-grid">
            <Prozentfeld
              id={`${formId}-verfuegbarkeit`}
              label="Verfügbarkeit"
              value={form.verfuegbarkeit}
              error={errors.verfuegbarkeit}
              onChange={(verfuegbarkeit) => updateForm({ ...form, verfuegbarkeit })}
            />
            <Prozentfeld
              id={`${formId}-leistung`}
              label="Leistung"
              value={form.leistung}
              error={errors.leistung}
              onChange={(leistung) => updateForm({ ...form, leistung })}
            />
            <Prozentfeld
              id={`${formId}-qualitaet`}
              label="Qualität"
              value={form.qualitaet}
              error={errors.qualitaet}
              onChange={(qualitaet) => updateForm({ ...form, qualitaet })}
            />
            <Prozentfeld
              id={`${formId}-oee`}
              label="OEE"
              value={form.oee}
              error={errors.oee}
              onChange={(oee) => updateForm({ ...form, oee })}
            />
          </div>
        </fieldset>

        <div className="einstellungen-actions">
          <button type="submit" className="btn">
            Übernehmen
          </button>
          <button type="button" className="btn" onClick={handleReset}>
            Zurück auf Demo
          </button>
          {hinweis ? (
            <p className="einstellungen-saved" role="status">
              {hinweis}
            </p>
          ) : null}
        </div>
      </form>
    </main>
  );
}

function Prozentfeld({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="einstellungen-field">
      <label htmlFor={id}>{label} (%)</label>
      <input
        id={id}
        name={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p className="einstellungen-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
