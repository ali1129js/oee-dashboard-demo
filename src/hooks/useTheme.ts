import { useCallback, useEffect, useState } from "react";
import { applyTheme, initialTheme, persistTheme, type ThemeName } from "@/theme/theme";

export function useTheme(): {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggle: () => void;
} {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeName) => {
    persistTheme(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((t) => {
      const next: ThemeName = t === "dark" ? "light" : "dark";
      persistTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
