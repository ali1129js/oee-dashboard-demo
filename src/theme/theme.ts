import { MOTION_KEY, THEME_KEY, type MotionName, type ThemeName } from "./colors";

export type { MotionName, ThemeName };

export function readStoredTheme(): ThemeName | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light") return "khaki";
    if (v === "dark") return "darkgrey";
    return v === "khaki" || v === "darkgrey" || v === "midnight" ? v : null;
  } catch {
    return null;
  }
}

export function systemTheme(): ThemeName {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "darkgrey"
    : "khaki";
}

export function initialTheme(): ThemeName {
  return readStoredTheme() ?? systemTheme();
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "khaki" ? "light" : "dark";
}

export function persistTheme(theme: ThemeName): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore write errors (private mode) */
  }
}

export function parseMotion(value: string | null): MotionName {
  return value === "animated" ? "animated" : "static";
}

export function readStoredMotion(): MotionName {
  try {
    return parseMotion(localStorage.getItem(MOTION_KEY));
  } catch {
    return "static";
  }
}

export function prefersReducedMotion(
  match: (query: string) => { matches: boolean } = (query) =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query)
      : { matches: false }
): boolean {
  return match("(prefers-reduced-motion: reduce)").matches;
}

export function effectiveMotion(stored: MotionName, reduced: boolean): MotionName {
  return reduced ? "static" : stored;
}

export function applyMotion(
  name: MotionName,
  root: HTMLElement = document.documentElement,
  reduced: boolean = prefersReducedMotion()
): void {
  root.dataset.motion = effectiveMotion(name, reduced);
}

export function persistMotion(name: MotionName): void {
  try {
    localStorage.setItem(MOTION_KEY, name);
  } catch {
    /* ignore */
  }
}

export function initialMotion(): MotionName {
  return readStoredMotion();
}
