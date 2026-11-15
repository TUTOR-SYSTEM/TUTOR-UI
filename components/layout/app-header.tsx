"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/providers/theme.provider";
import { ThemePickerDialog } from "@/components/theme/theme-picker-dialog";
import { LanguageToggle } from "@/components/auth/language-toggle";
import { useAppShellCopy } from "@/hooks/useAppShellCopy.hook";

function getPageTitle(
  pathname: string,
  pageTitles: Record<string, string>,
): string {
  const routeTitles: Record<string, string> = {
    "/": pageTitles.overview,
    "/schedule": pageTitles.schedule,
    "/notifications": pageTitles.notifications,
    "/classes": pageTitles.classes,
    "/students": pageTitles.students,
    "/fees": pageTitles.fees,
    "/discussions": pageTitles.discussions,
    "/ai-chat": pageTitles.aiChat,
    "/practice-exams": pageTitles.practiceExams,
    "/settings": pageTitles.settings,
    "/curriculum": pageTitles.curriculum,
    "/grades": pageTitles.grades,
    "/sessions": pageTitles.sessions,
    "/tutors": pageTitles.tutors,
  };

  if (routeTitles[pathname]) return routeTitles[pathname];
  const segment = "/" + pathname.split("/")[1];
  return routeTitles[segment] ?? pageTitles.overview;
}

const AppHeader = () => {
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const { pageTitles, header } = useAppShellCopy();

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <header className="flex h-16 w-full items-center gap-4 border-b bg-card px-6">
      {/* Page title */}
      <h1 className="flex-1 text-xl font-bold text-foreground">
        {getPageTitle(pathname, pageTitles)}
      </h1>

      {/* Bell */}

      {/* Secondary controls */}
      <div className="flex shrink-0 items-center gap-1">
        <LanguageToggle />

        <button
          type="button"
          aria-label={header.toggleTheme}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <ThemeIcon className="size-4" />
        </button>

        <button
          type="button"
          aria-label={header.colorTheme}
          onClick={() => setThemePickerOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <Palette className="size-4" />
        </button>
      </div>

      <ThemePickerDialog
        open={themePickerOpen}
        onClose={() => setThemePickerOpen(false)}
      />
    </header>
  );
};

export default AppHeader;
