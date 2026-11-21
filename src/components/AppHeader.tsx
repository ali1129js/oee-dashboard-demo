import { MotionToggle } from "@/components/MotionToggle";
import { DEMO_DATUM, LINIE_NAME, LINIE_UNTERTITEL } from "@/lib/types";
import { PAGE_IDS, PAGE_LABELS, type PageId } from "@/lib/navigation";
import {
  THEME_LABELS,
  THEME_NAMES,
  type MotionName,
  type ThemeName,
} from "@/theme/colors";

type Props = {
  page: PageId;
  theme: ThemeName;
  onTheme: (theme: ThemeName) => void;
  motion: MotionName;
  onMotion: (motion: MotionName) => void;
  reducedMotion: boolean;
};

const LATER_TABS = ["Historie", "Einstellungen"] as const;

export function AppHeader({
  page,
  theme,
  onTheme,
  motion,
  onMotion,
  reducedMotion,
}: Props) {
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
          {PAGE_IDS.map((id) => (
            <a
              key={id}
              className="nav__item"
              href={`#${id}`}
              aria-current={page === id ? "page" : undefined}
            >
              {PAGE_LABELS[id]}
            </a>
          ))}
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
          <div className="theme-tools">
            <div role="group" aria-label="Farbschema" className="segmented wrap">
              {THEME_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="segment"
                  aria-pressed={theme === name}
                  onClick={() => onTheme(name)}
                >
                  {THEME_LABELS[name]}
                </button>
              ))}
            </div>
            <MotionToggle
              value={motion}
              onChange={onMotion}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
