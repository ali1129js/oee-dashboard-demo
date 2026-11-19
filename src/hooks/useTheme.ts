import { useCallback, useEffect, useState } from "react";
import { applyTheme, initialTheme, persistTheme, type ThemeName } from "@/theme/theme";

export function useTheme(): {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
} {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeName) => {
    persistTheme(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
