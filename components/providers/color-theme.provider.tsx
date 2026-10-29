"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_ACCENT_ID,
  DEFAULT_COLOR_THEME_ID,
  applyAccentVars,
  applyColorThemeVars,
  clearColorThemeVars,
  colorThemes,
  findAccent,
  findColorTheme,
  type AccentSelection,
  type ColorThemeSelection,
} from "@/lib/color-themes";
import { useTheme } from "./theme.provider";

export const COLOR_THEME_STORAGE_KEY = "color-theme-preference";
export const ACCENT_STORAGE_KEY = "accent-color-preference";

type ColorThemeContextValue = {
  colorTheme: ColorThemeSelection;
  setColorTheme: (id: ColorThemeSelection) => void;
  themes: typeof colorThemes;
  /** Màu nhấn — chỉ đổi nhóm biến primary, không đổi radius/nền (khác `colorTheme`). */
  accent: AccentSelection;
  setAccent: (id: AccentSelection) => void;
};

const ColorThemeContext = createContext<ColorThemeContextValue>({
  colorTheme: DEFAULT_COLOR_THEME_ID,
  setColorTheme: () => {},
  themes: colorThemes,
  accent: DEFAULT_ACCENT_ID,
  setAccent: () => {},
});

/** @internal exported for testing */
export function readStoredColorTheme(): ColorThemeSelection {
  if (typeof window === "undefined") {
    return DEFAULT_COLOR_THEME_ID;
  }

  try {
    const raw = localStorage.getItem(COLOR_THEME_STORAGE_KEY);

    if (
      raw === DEFAULT_COLOR_THEME_ID ||
      findColorTheme(raw as ColorThemeSelection)
    ) {
      return raw as ColorThemeSelection;
    }
  } catch {
    //
  }

  return DEFAULT_COLOR_THEME_ID;
}

/** @internal exported for testing */
export function readStoredAccent(): AccentSelection {
  if (typeof window === "undefined") {
    return DEFAULT_ACCENT_ID;
  }

  try {
    const raw = localStorage.getItem(ACCENT_STORAGE_KEY);

    if (raw && findAccent(raw as AccentSelection)) {
      return raw as AccentSelection;
    }
  } catch {
    //
  }

  return DEFAULT_ACCENT_ID;
}

export const ColorThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { resolvedTheme } = useTheme();
  const [colorTheme, setColorThemeState] = useState<ColorThemeSelection>(
    DEFAULT_COLOR_THEME_ID,
  );
  const [accent, setAccentState] =
    useState<AccentSelection>(DEFAULT_ACCENT_ID);

  useEffect(() => {
    const timer = setTimeout(() => {
      setColorThemeState(readStoredColorTheme());
      setAccentState(readStoredAccent());
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const theme = findColorTheme(colorTheme);

    if (!theme) {
      clearColorThemeVars();
      return;
    }

    applyColorThemeVars(theme, resolvedTheme);
  }, [colorTheme, resolvedTheme]);

  // Chạy sau effect theme đầy đủ ở trên để màu nhấn ghi đè nhóm biến primary.
  useEffect(() => {
    const picked = findAccent(accent);

    if (picked) {
      applyAccentVars(picked, resolvedTheme);
    }
  }, [accent, colorTheme, resolvedTheme]);

  const setColorTheme = useCallback((id: ColorThemeSelection) => {
    setColorThemeState(id);

    try {
      localStorage.setItem(COLOR_THEME_STORAGE_KEY, id);
    } catch {
      //
    }
  }, []);

  const setAccent = useCallback((id: AccentSelection) => {
    setAccentState(id);

    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, id);
    } catch {
      //
    }
  }, []);

  const value = useMemo(
    () => ({ colorTheme, setColorTheme, themes: colorThemes, accent, setAccent }),
    [colorTheme, setColorTheme, accent, setAccent],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => useContext(ColorThemeContext);
