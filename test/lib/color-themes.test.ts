import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_COLOR_THEME_ID,
  applyColorThemeVars,
  clearColorThemeVars,
  colorThemes,
  findColorTheme,
} from "@/lib/color-themes";

describe("color-themes", () => {
  afterEach(() => {
    clearColorThemeVars();
  });

  it("defines unique theme ids", () => {
    const ids = colorThemes.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(9);
  });

  it("finds a theme by id and returns undefined for the default selection", () => {
    expect(findColorTheme("claude")?.id).toBe("claude");
    expect(findColorTheme(DEFAULT_COLOR_THEME_ID)).toBeUndefined();
  });

  it("applies light vars to the document root", () => {
    const theme = colorThemes[0];
    applyColorThemeVars(theme, "light");
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--background")).toBe(theme.light.background);
    expect(root.style.getPropertyValue("--primary")).toBe(theme.light.primary);
    expect(root.style.getPropertyValue("--radius")).toBe(theme.light.radius);
  });

  it("applies dark vars when mode is dark", () => {
    const theme = colorThemes[0];
    applyColorThemeVars(theme, "dark");
    expect(document.documentElement.style.getPropertyValue("--background")).toBe(
      theme.dark.background,
    );
  });

  it("clears every applied css variable", () => {
    applyColorThemeVars(colorThemes[0], "light");
    clearColorThemeVars();
    expect(document.documentElement.style.getPropertyValue("--background")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--chart-5")).toBe("");
  });
});
