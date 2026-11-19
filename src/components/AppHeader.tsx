import { DEMO_DATUM, LINIE_NAME, LINIE_UNTERTITEL } from "@/lib/types";
import type { ThemeName } from "@/theme/colors";

type Props = {
  theme: ThemeName;
  onToggleTheme: () => void;
};

const LATER_TABS = ["Linienübersicht", "Historie", "Einstellungen"] as const;

export function AppHeader({ theme, onToggleTheme }: Props) {
  const next = theme === "dark" ? "Hell" : "Dunkel";
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">
          <svg
            className="brand__mark"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <path
              d="M8 21l5-6 4 3 7-9"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="brand__title">{LINIE_NAME}</p>
            <p className="brand__sub">{LINIE_UNTERTITEL}</p>
          </div>
        </div>

        <nav className="nav" aria-label="Seiten">
          <a className="nav__item" href="#uebersicht" aria-current="page">
            Übersicht
          </a>
          {LATER_TABS.map((name) => (
            <span
              key={name}
              className="nav__item is-disabled"
              title="bald verfügbar"
              aria-disabled="true"
            >
              {name}
              <span className="nav__soon">bald verfügbar</span>
            </span>
          ))}
        </nav>

        <div className="topbar__meta">
          <p className="meta-chip" aria-label="Schicht Früh">
            Schicht: Früh
          </p>
          <p className="meta-chip">
            <time dateTime="2026-11-19">{DEMO_DATUM}</time>
          </p>
          <button
            type="button"
            className="btn btn--theme"
            onClick={onToggleTheme}
            aria-label={`Farbschema ${theme === "dark" ? "Dunkel" : "Hell"}, umschalten auf ${next}`}
          >
            {next}
          </button>
        </div>
      </div>
    </header>
  );
}
