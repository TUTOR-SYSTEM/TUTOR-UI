export type ColorThemeId =
  | "claude"
  | "twitter"
  | "violet-bloom"
  | "supabase"
  | "tangerine"
  | "darkmatter"
  | "doom-64"
  | "modern-minimal"
  | "t3-chat";

export const DEFAULT_COLOR_THEME_ID = "default" as const;

export type ColorThemeSelection = ColorThemeId | typeof DEFAULT_COLOR_THEME_ID;

export type ColorThemeVars = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  primaryLight: string;
  primarySoft: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  radius: string;
};

export type ColorTheme = {
  id: ColorThemeId;
  name: string;
  description: string;
  light: ColorThemeVars;
  dark: ColorThemeVars;
};

type ColorThemeInput = {
  background: string;
  foreground: string;
  sidebarForeground?: string;
  primary: string;
  primaryForeground: string;
  primaryHover?: string;
  primaryLight?: string;
  primarySoft?: string;
  secondary: string;
  secondaryForeground?: string;
  accent: string;
  accentForeground?: string;
  muted: string;
  mutedForeground: string;
  border: string;
  success?: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarPrimary: string;
  sidebarAccent: string;
  radius: string;
};

const buildVars = (input: ColorThemeInput): ColorThemeVars => ({
  background: input.background,
  foreground: input.foreground,
  card: input.background,
  cardForeground: input.foreground,
  popover: input.background,
  popoverForeground: input.foreground,
  primary: input.primary,
  primaryForeground: input.primaryForeground,
  primaryHover: input.primaryHover ?? input.primary,
  primaryLight: input.primaryLight ?? input.primary,
  primarySoft: input.primarySoft ?? input.primary,
  secondary: input.secondary,
  secondaryForeground: input.secondaryForeground ?? input.foreground,
  muted: input.muted,
  mutedForeground: input.mutedForeground,
  accent: input.accent,
  accentForeground: input.accentForeground ?? input.foreground,
  border: input.border,
  input: input.border,
  ring: input.primary,
  success: input.success ?? input.primary,
  chart1: input.chart1,
  chart2: input.chart2,
  chart3: input.chart3,
  chart4: input.chart4,
  chart5: input.chart5,
  sidebar: input.sidebar,
  sidebarForeground: input.sidebarForeground ?? input.foreground,
  sidebarPrimary: input.sidebarPrimary,
  sidebarPrimaryForeground: input.primaryForeground,
  sidebarAccent: input.sidebarAccent,
  sidebarAccentForeground: input.foreground,
  sidebarBorder: input.border,
  sidebarRing: input.primary,
  radius: input.radius,
});

/** Color presets sourced from tweakcn.com registry (oklch values kept verbatim). */
export const colorThemes: ColorTheme[] = [
  {
    id: "claude",
    name: "Claude",
    description: "Warm amber tones",
    light: buildVars({
      background: "oklch(0.9818 0.0054 95.0986)",
      foreground: "oklch(0.3438 0.0269 95.7226)",
      sidebarForeground: "lab(25.6871% -.497073 1.86663)",
      primary: "oklch(0.6171 0.1375 39.0427)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.9245 0.0138 92.9892)",
      accent: "oklch(0.9245 0.0138 92.9892)",
      muted: "oklch(0.9341 0.0153 90.2390)",
      mutedForeground: "oklch(0.6059 0.0075 97.4233)",
      border: "oklch(0.8847 0.0069 97.3627)",
      chart1: "oklch(0.5583 0.1276 42.9956)",
      chart2: "oklch(0.6898 0.1581 290.4107)",
      chart3: "oklch(0.8816 0.0276 93.1280)",
      chart4: "oklch(0.8822 0.0403 298.1792)",
      chart5: "oklch(0.5608 0.1348 42.0584)",
      sidebar: "oklch(0.9663 0.0080 98.8792)",
      sidebarPrimary: "oklch(0.6171 0.1375 39.0427)",
      sidebarAccent: "oklch(0.9245 0.0138 92.9892)",
      radius: "0.5rem",
    }),
    dark: buildVars({
      background: "oklch(0.2679 0.0036 106.6427)",
      foreground: "oklch(0.8074 0.0142 93.0137)",
      primary: "oklch(0.6724 0.1308 38.7559)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.9818 0.0054 95.0986)",
      accent: "oklch(0.2130 0.0078 95.4245)",
      muted: "oklch(0.2213 0.0038 106.7070)",
      mutedForeground: "oklch(0.7713 0.0169 99.0657)",
      border: "oklch(0.3618 0.0101 106.8928)",
      chart1: "oklch(0.5583 0.1276 42.9956)",
      chart2: "oklch(0.6898 0.1581 290.4107)",
      chart3: "oklch(0.2130 0.0078 95.4245)",
      chart4: "oklch(0.3074 0.0516 289.3230)",
      chart5: "oklch(0.5608 0.1348 42.0584)",
      sidebar: "oklch(0.2357 0.0024 67.7077)",
      sidebarPrimary: "oklch(0.3250 0 0)",
      sidebarAccent: "oklch(0.1680 0.0020 106.6177)",
      radius: "0.5rem",
    }),
  },
  {
    id: "twitter",
    name: "Twitter",
    description: "Clean sky blue interface",
    light: buildVars({
      background: "oklch(1.0000 0 0)",
      foreground: "oklch(0.1884 0.0128 248.5103)",
      primary: "oklch(0.6723 0.1606 244.9955)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.1884 0.0128 248.5103)",
      secondaryForeground: "oklch(1.0000 0 0)",
      accent: "oklch(0.9392 0.0166 250.8453)",
      muted: "oklch(0.9222 0.0013 286.3737)",
      mutedForeground: "oklch(0.1884 0.0128 248.5103)",
      border: "oklch(0.9317 0.0118 231.6594)",
      chart1: "oklch(0.6723 0.1606 244.9955)",
      chart2: "oklch(0.6907 0.1554 160.3454)",
      chart3: "oklch(0.8214 0.1600 82.5337)",
      chart4: "oklch(0.7064 0.1822 151.7125)",
      chart5: "oklch(0.5919 0.2186 10.5826)",
      sidebar: "oklch(0.9784 0.0011 197.1387)",
      sidebarPrimary: "oklch(0.6723 0.1606 244.9955)",
      sidebarAccent: "oklch(0.9392 0.0166 250.8453)",
      radius: "1.3rem",
    }),
    dark: buildVars({
      background: "oklch(0 0 0)",
      foreground: "oklch(0.9328 0.0025 228.7857)",
      primary: "oklch(0.6692 0.1607 245.0110)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.9622 0.0035 219.5331)",
      secondaryForeground: "oklch(0.1884 0.0128 248.5103)",
      accent: "oklch(0.1928 0.0331 242.5459)",
      muted: "oklch(0.2090 0 0)",
      mutedForeground: "oklch(0.5637 0.0078 247.9662)",
      border: "oklch(0.2674 0.0047 248.0045)",
      chart1: "oklch(0.6723 0.1606 244.9955)",
      chart2: "oklch(0.6907 0.1554 160.3454)",
      chart3: "oklch(0.8214 0.1600 82.5337)",
      chart4: "oklch(0.7064 0.1822 151.7125)",
      chart5: "oklch(0.5919 0.2186 10.5826)",
      sidebar: "oklch(0.2097 0.0080 274.5332)",
      sidebarPrimary: "oklch(0.6818 0.1584 243.3540)",
      sidebarAccent: "oklch(0.1928 0.0331 242.5459)",
      radius: "1.3rem",
    }),
  },
  {
    id: "violet-bloom",
    name: "Violet Bloom",
    description: "Deep purple gradient",
    light: buildVars({
      background: "oklch(0.9940 0 0)",
      foreground: "oklch(0 0 0)",
      primary: "oklch(0.5393 0.2713 286.7462)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.9540 0.0063 255.4755)",
      accent: "oklch(0.9393 0.0288 266.3680)",
      muted: "oklch(0.9702 0 0)",
      mutedForeground: "oklch(0.4386 0 0)",
      border: "oklch(0.9300 0.0094 286.2156)",
      chart1: "oklch(0.7459 0.1483 156.4499)",
      chart2: "oklch(0.5393 0.2713 286.7462)",
      chart3: "oklch(0.7336 0.1758 50.5517)",
      chart4: "oklch(0.5828 0.1809 259.7276)",
      chart5: "oklch(0.5590 0 0)",
      sidebar: "oklch(0.9777 0.0051 247.8763)",
      sidebarPrimary: "oklch(0 0 0)",
      sidebarAccent: "oklch(0.9401 0 0)",
      radius: "1.4rem",
    }),
    dark: buildVars({
      background: "oklch(0.2223 0.0060 271.1393)",
      foreground: "oklch(0.9551 0 0)",
      primary: "oklch(0.6132 0.2294 291.7437)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.2940 0.0130 272.9312)",
      accent: "oklch(0.2795 0.0368 260.0310)",
      muted: "oklch(0.2940 0.0130 272.9312)",
      mutedForeground: "oklch(0.7058 0 0)",
      border: "oklch(0.3289 0.0092 268.3843)",
      chart1: "oklch(0.8003 0.1821 151.7110)",
      chart2: "oklch(0.6132 0.2294 291.7437)",
      chart3: "oklch(0.8077 0.1035 19.5706)",
      chart4: "oklch(0.6691 0.1569 260.1063)",
      chart5: "oklch(0.7058 0 0)",
      sidebar: "oklch(0.2011 0.0039 286.0396)",
      sidebarPrimary: "oklch(0.6132 0.2294 291.7437)",
      sidebarAccent: "oklch(0.2940 0.0130 272.9312)",
      radius: "1.4rem",
    }),
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Emerald green terminal",
    light: buildVars({
      background: "oklch(0.9911 0 0)",
      foreground: "oklch(0.2046 0 0)",
      primary: "oklch(0.8348 0.1302 160.9080)",
      primaryForeground: "oklch(0.2626 0.0147 166.4589)",
      secondary: "oklch(0.9940 0 0)",
      accent: "oklch(0.9461 0 0)",
      muted: "oklch(0.9461 0 0)",
      mutedForeground: "oklch(0.2435 0 0)",
      border: "oklch(0.9037 0 0)",
      chart1: "oklch(0.8348 0.1302 160.9080)",
      chart2: "oklch(0.6231 0.1880 259.8145)",
      chart3: "oklch(0.6056 0.2189 292.7172)",
      chart4: "oklch(0.7686 0.1647 70.0804)",
      chart5: "oklch(0.6959 0.1491 162.4796)",
      sidebar: "oklch(0.9911 0 0)",
      sidebarPrimary: "oklch(0.8348 0.1302 160.9080)",
      sidebarAccent: "oklch(0.9461 0 0)",
      radius: "0.5rem",
    }),
    dark: buildVars({
      background: "oklch(0.1822 0 0)",
      foreground: "oklch(0.9288 0.0126 255.5078)",
      primary: "oklch(0.4365 0.1044 156.7556)",
      primaryForeground: "oklch(0.9213 0.0135 167.1556)",
      secondary: "oklch(0.2603 0 0)",
      accent: "oklch(0.3132 0 0)",
      muted: "oklch(0.2393 0 0)",
      mutedForeground: "oklch(0.7122 0 0)",
      border: "oklch(0.2809 0 0)",
      chart1: "oklch(0.8003 0.1821 151.7110)",
      chart2: "oklch(0.7137 0.1434 254.6240)",
      chart3: "oklch(0.7090 0.1592 293.5412)",
      chart4: "oklch(0.8369 0.1644 84.4286)",
      chart5: "oklch(0.7845 0.1325 181.9120)",
      sidebar: "oklch(0.1822 0 0)",
      sidebarPrimary: "oklch(0.4365 0.1044 156.7556)",
      sidebarAccent: "oklch(0.3132 0 0)",
      radius: "0.5rem",
    }),
  },
  {
    id: "tangerine",
    name: "Tangerine",
    description: "Orange on cool blue-gray",
    light: buildVars({
      background: "oklch(0.9383 0.0042 236.4993)",
      foreground: "oklch(0.3211 0 0)",
      primary: "oklch(0.6397 0.1720 36.4421)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.9670 0.0029 264.5419)",
      accent: "oklch(0.9119 0.0222 243.8174)",
      muted: "oklch(0.9846 0.0017 247.8389)",
      mutedForeground: "oklch(0.5510 0.0234 264.3637)",
      border: "oklch(0.9022 0.0052 247.8822)",
      chart1: "oklch(0.7156 0.0605 248.6845)",
      chart2: "oklch(0.7875 0.0917 35.9616)",
      chart3: "oklch(0.5778 0.0759 254.1573)",
      chart4: "oklch(0.5016 0.0849 259.4902)",
      chart5: "oklch(0.4241 0.0952 264.0306)",
      sidebar: "oklch(0.9030 0.0046 258.3257)",
      sidebarPrimary: "oklch(0.6397 0.1720 36.4421)",
      sidebarAccent: "oklch(0.9119 0.0222 243.8174)",
      radius: "0.75rem",
    }),
    dark: buildVars({
      background: "oklch(0.2598 0.0306 262.6666)",
      foreground: "oklch(0.9219 0 0)",
      primary: "oklch(0.6397 0.1720 36.4421)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.3095 0.0266 266.7132)",
      accent: "oklch(0.3380 0.0589 267.5867)",
      muted: "oklch(0.3095 0.0266 266.7132)",
      mutedForeground: "oklch(0.7155 0 0)",
      border: "oklch(0.3843 0.0301 269.7337)",
      chart1: "oklch(0.7156 0.0605 248.6845)",
      chart2: "oklch(0.7693 0.0876 34.1875)",
      chart3: "oklch(0.5778 0.0759 254.1573)",
      chart4: "oklch(0.5016 0.0849 259.4902)",
      chart5: "oklch(0.4241 0.0952 264.0306)",
      sidebar: "oklch(0.3100 0.0283 267.7408)",
      sidebarPrimary: "oklch(0.6397 0.1720 36.4421)",
      sidebarAccent: "oklch(0.3380 0.0589 267.5867)",
      radius: "0.75rem",
    }),
  },
  {
    id: "darkmatter",
    name: "Darkmatter",
    description: "Amber & teal on dark surface",
    light: buildVars({
      background: "oklch(1.0000 0 0)",
      foreground: "oklch(0.2101 0.0318 264.6645)",
      primary: "oklch(0.6716 0.1368 48.5130)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.5360 0.0398 196.0280)",
      accent: "oklch(0.9491 0 0)",
      muted: "oklch(0.9670 0.0029 264.5419)",
      mutedForeground: "oklch(0.5510 0.0234 264.3637)",
      border: "oklch(0.9276 0.0058 264.5313)",
      chart1: "oklch(0.5940 0.0443 196.0233)",
      chart2: "oklch(0.7214 0.1337 49.9802)",
      chart3: "oklch(0.8721 0.0864 68.5474)",
      chart4: "oklch(0.6268 0 0)",
      chart5: "oklch(0.6830 0 0)",
      sidebar: "oklch(0.9670 0.0029 264.5419)",
      sidebarPrimary: "oklch(0.6716 0.1368 48.5130)",
      sidebarAccent: "oklch(1.0000 0 0)",
      radius: "0.75rem",
    }),
    dark: buildVars({
      background: "oklch(0.1797 0.0043 308.1928)",
      foreground: "oklch(0.8109 0 0)",
      primary: "oklch(0.7214 0.1337 49.9802)",
      primaryForeground: "oklch(0.1797 0.0043 308.1928)",
      secondary: "oklch(0.5940 0.0443 196.0233)",
      accent: "oklch(0.3211 0 0)",
      muted: "oklch(0.2520 0 0)",
      mutedForeground: "oklch(0.6268 0 0)",
      border: "oklch(0.2520 0 0)",
      chart1: "oklch(0.5940 0.0443 196.0233)",
      chart2: "oklch(0.7214 0.1337 49.9802)",
      chart3: "oklch(0.8721 0.0864 68.5474)",
      chart4: "oklch(0.6268 0 0)",
      chart5: "oklch(0.6830 0 0)",
      sidebar: "oklch(0.1822 0 0)",
      sidebarPrimary: "oklch(0.7214 0.1337 49.9802)",
      sidebarAccent: "oklch(0.3211 0 0)",
      radius: "0.75rem",
    }),
  },
  {
    id: "doom-64",
    name: "Doom 64",
    description: "Retro shooter, zero radius",
    light: buildVars({
      background: "oklch(0.8452 0 0)",
      foreground: "oklch(0.2393 0 0)",
      primary: "oklch(0.5016 0.1887 27.4816)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.4955 0.0896 126.1858)",
      accent: "oklch(0.5880 0.0993 245.7394)",
      muted: "oklch(0.7826 0 0)",
      mutedForeground: "oklch(0.4091 0 0)",
      border: "oklch(0.4313 0 0)",
      chart1: "oklch(0.5016 0.1887 27.4816)",
      chart2: "oklch(0.4955 0.0896 126.1858)",
      chart3: "oklch(0.5880 0.0993 245.7394)",
      chart4: "oklch(0.7076 0.1975 46.4558)",
      chart5: "oklch(0.5656 0.0431 40.4319)",
      sidebar: "oklch(0.7572 0 0)",
      sidebarPrimary: "oklch(0.5016 0.1887 27.4816)",
      sidebarAccent: "oklch(0.5880 0.0993 245.7394)",
      radius: "0rem",
    }),
    dark: buildVars({
      background: "oklch(0.2178 0 0)",
      foreground: "oklch(0.9067 0 0)",
      primary: "oklch(0.6083 0.2090 27.0276)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.6423 0.1467 133.0145)",
      accent: "oklch(0.7482 0.1235 244.7492)",
      muted: "oklch(0.2645 0 0)",
      mutedForeground: "oklch(0.7058 0 0)",
      border: "oklch(0.4091 0 0)",
      chart1: "oklch(0.6083 0.2090 27.0276)",
      chart2: "oklch(0.6423 0.1467 133.0145)",
      chart3: "oklch(0.7482 0.1235 244.7492)",
      chart4: "oklch(0.7839 0.1719 68.0943)",
      chart5: "oklch(0.6471 0.0334 40.7963)",
      sidebar: "oklch(0.1913 0 0)",
      sidebarPrimary: "oklch(0.6083 0.2090 27.0276)",
      sidebarAccent: "oklch(0.7482 0.1235 244.7492)",
      radius: "0rem",
    }),
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean blue minimal interface",
    light: buildVars({
      background: "oklch(1.0000 0 0)",
      foreground: "oklch(0.3211 0 0)",
      primary: "oklch(0.6231 0.1880 259.8145)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.9670 0.0029 264.5419)",
      accent: "oklch(0.9514 0.0250 236.8242)",
      muted: "oklch(0.9846 0.0017 247.8389)",
      mutedForeground: "oklch(0.5510 0.0234 264.3637)",
      border: "oklch(0.9276 0.0058 264.5313)",
      chart1: "oklch(0.6231 0.1880 259.8145)",
      chart2: "oklch(0.5461 0.2152 262.8809)",
      chart3: "oklch(0.4882 0.2172 264.3763)",
      chart4: "oklch(0.4244 0.1809 265.6377)",
      chart5: "oklch(0.3791 0.1378 265.5222)",
      sidebar: "oklch(0.9846 0.0017 247.8389)",
      sidebarPrimary: "oklch(0.6231 0.1880 259.8145)",
      sidebarAccent: "oklch(0.9514 0.0250 236.8242)",
      radius: "0.375rem",
    }),
    dark: buildVars({
      background: "oklch(0.2046 0 0)",
      foreground: "oklch(0.9219 0 0)",
      primary: "oklch(0.6231 0.1880 259.8145)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.2686 0 0)",
      accent: "oklch(0.3791 0.1378 265.5222)",
      muted: "oklch(0.2393 0 0)",
      mutedForeground: "oklch(0.7155 0 0)",
      border: "oklch(0.3715 0 0)",
      chart1: "oklch(0.7137 0.1434 254.6240)",
      chart2: "oklch(0.6231 0.1880 259.8145)",
      chart3: "oklch(0.5461 0.2152 262.8809)",
      chart4: "oklch(0.4882 0.2172 264.3763)",
      chart5: "oklch(0.4244 0.1809 265.6377)",
      sidebar: "oklch(0.2046 0 0)",
      sidebarPrimary: "oklch(0.6231 0.1880 259.8145)",
      sidebarAccent: "oklch(0.3791 0.1378 265.5222)",
      radius: "0.375rem",
    }),
  },
  {
    id: "t3-chat",
    name: "T3 Chat",
    description: "Pink and purple chat vibes",
    light: buildVars({
      background: "oklch(0.9754 0.0084 325.6414)",
      foreground: "oklch(0.3257 0.1161 325.0372)",
      primary: "oklch(0.5316 0.1409 355.1999)",
      primaryForeground: "oklch(1.0000 0 0)",
      secondary: "oklch(0.8696 0.0675 334.8991)",
      accent: "oklch(0.8696 0.0675 334.8991)",
      muted: "oklch(0.9395 0.0260 331.5454)",
      mutedForeground: "oklch(0.4924 0.1244 324.4523)",
      border: "oklch(0.8568 0.0829 328.9110)",
      chart1: "oklch(0.6038 0.2363 344.4657)",
      chart2: "oklch(0.4445 0.2251 300.6246)",
      chart3: "oklch(0.3790 0.0438 226.1538)",
      chart4: "oklch(0.8330 0.1185 88.3461)",
      chart5: "oklch(0.7843 0.1256 58.9964)",
      sidebar: "oklch(0.9360 0.0288 320.5788)",
      sidebarPrimary: "oklch(0.3963 0.0251 285.1962)",
      sidebarAccent: "oklch(0.9789 0.0013 106.4235)",
      radius: "0.5rem",
    }),
    dark: buildVars({
      background: "oklch(0.2409 0.0201 307.5346)",
      foreground: "oklch(0.8398 0.0387 309.5391)",
      primary: "oklch(0.4607 0.1853 4.0994)",
      primaryForeground: "oklch(0.8560 0.0618 346.3684)",
      secondary: "oklch(0.3137 0.0306 310.0610)",
      accent: "oklch(0.3649 0.0508 308.4911)",
      muted: "oklch(0.2634 0.0219 309.4748)",
      mutedForeground: "oklch(0.7940 0.0372 307.1032)",
      border: "oklch(0.3286 0.0154 343.4461)",
      chart1: "oklch(0.5316 0.1409 355.1999)",
      chart2: "oklch(0.5633 0.1912 306.8561)",
      chart3: "oklch(0.7227 0.1502 60.5799)",
      chart4: "oklch(0.6193 0.2029 312.7422)",
      chart5: "oklch(0.6118 0.2093 6.1387)",
      sidebar: "oklch(0.1893 0.0163 331.0475)",
      sidebarPrimary: "oklch(0.4882 0.2172 264.3763)",
      sidebarAccent: "oklch(0.2337 0.0261 338.1961)",
      radius: "0.5rem",
    }),
  },
];

export const findColorTheme = (
  id: ColorThemeSelection,
): ColorTheme | undefined => colorThemes.find((theme) => theme.id === id);

const CSS_VAR_MAP: Record<keyof ColorThemeVars, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  primaryHover: "--primary-hover",
  primaryLight: "--primary-light",
  primarySoft: "--primary-soft",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  success: "--success",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
  radius: "--radius",
};

export const applyColorThemeVars = (
  theme: ColorTheme,
  mode: "light" | "dark",
) => {
  if (typeof document === "undefined") {
    return;
  }

  const vars = mode === "dark" ? theme.dark : theme.light;
  const root = document.documentElement;

  (Object.keys(CSS_VAR_MAP) as (keyof ColorThemeVars)[]).forEach((key) => {
    root.style.setProperty(CSS_VAR_MAP[key], vars[key]);
  });
};

export const clearColorThemeVars = () => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  Object.values(CSS_VAR_MAP).forEach((cssVar) =>
    root.style.removeProperty(cssVar),
  );
};

// ─── Accent (màu nhấn) ───────────────────────────────────────────────────────
// Chỉ ghi đè nhóm biến "primary" — không đụng radius/nền/card nên không đổi kiểu dáng
// button, khác với `ColorTheme` (preset đầy đủ). Áp SAU theme đầy đủ.

export type AccentId = "teal" | "blue" | "purple" | "pink" | "orange";

export const DEFAULT_ACCENT_ID = "default" as const;

export type AccentSelection = AccentId | typeof DEFAULT_ACCENT_ID;

type AccentVars = {
  primary: string;
  foreground: string;
  hover: string;
  light: string;
  soft: string;
};

export type Accent = {
  id: AccentId;
  /** Màu hiển thị trên swatch. */
  hex: string;
  light: AccentVars;
  dark: AccentVars;
};

export const accents: Accent[] = [
  {
    id: "teal",
    hex: "#0E9F8E",
    light: { primary: "#0e9f8e", foreground: "#ffffff", hover: "#0b7a6d", light: "#e4f6ef", soft: "#f1fbf9" },
    dark: { primary: "#15c2a8", foreground: "#072820", hover: "#0e9f8e", light: "#0b3830", soft: "#072820" },
  },
  {
    id: "blue",
    hex: "#3B82F6",
    light: { primary: "#3b82f6", foreground: "#ffffff", hover: "#2563eb", light: "#dbeafe", soft: "#eff6ff" },
    dark: { primary: "#60a5fa", foreground: "#0b1220", hover: "#3b82f6", light: "#172554", soft: "#0f1b3d" },
  },
  {
    id: "purple",
    hex: "#8B5CF6",
    light: { primary: "#8b5cf6", foreground: "#ffffff", hover: "#7c3aed", light: "#ede9fe", soft: "#f5f3ff" },
    dark: { primary: "#a78bfa", foreground: "#150b2e", hover: "#8b5cf6", light: "#2e1065", soft: "#1e1038" },
  },
  {
    id: "pink",
    hex: "#EC4899",
    light: { primary: "#ec4899", foreground: "#ffffff", hover: "#db2777", light: "#fce7f3", soft: "#fdf2f8" },
    dark: { primary: "#f472b6", foreground: "#2a0617", hover: "#ec4899", light: "#500724", soft: "#33071a" },
  },
  {
    id: "orange",
    hex: "#F97316",
    light: { primary: "#f97316", foreground: "#ffffff", hover: "#ea580c", light: "#ffedd5", soft: "#fff7ed" },
    dark: { primary: "#fb923c", foreground: "#2a1004", hover: "#f97316", light: "#431407", soft: "#2b0d04" },
  },
];

export const findAccent = (id: AccentSelection): Accent | undefined =>
  accents.find((accent) => accent.id === id);

export const applyAccentVars = (accent: Accent, mode: "light" | "dark") => {
  if (typeof document === "undefined") {
    return;
  }

  const v = mode === "dark" ? accent.dark : accent.light;
  const style = document.documentElement.style;
  const tint = mode === "dark" ? v.light : v.soft;

  style.setProperty("--primary", v.primary);
  style.setProperty("--primary-foreground", v.foreground);
  style.setProperty("--primary-hover", v.hover);
  style.setProperty("--primary-light", v.light);
  style.setProperty("--primary-soft", v.soft);
  style.setProperty("--ring", v.primary);
  style.setProperty("--accent", v.light);
  style.setProperty("--accent-foreground", mode === "dark" ? v.primary : v.hover);
  style.setProperty("--secondary", tint);
  style.setProperty("--sidebar-primary", v.primary);
  style.setProperty("--sidebar-primary-foreground", v.foreground);
  style.setProperty("--sidebar-ring", v.primary);
  style.setProperty("--sidebar-accent", tint);
  style.setProperty("--sidebar-accent-foreground", mode === "dark" ? v.primary : v.hover);
};
