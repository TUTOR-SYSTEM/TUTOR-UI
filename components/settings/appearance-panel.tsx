"use client";

import { Button } from "@/components/ui/button.ui";
import { OptionCard } from "@/components/ui/option-card.ui";
import { Check } from "lucide-react";
import { useTheme } from "@/components/providers/theme.provider";
import { useColorTheme } from "@/components/providers/color-theme.provider";
import { accents } from "@/lib/color-themes";
import { useLocale } from "@/hooks/useLocale.hook";

export function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useColorTheme();
  const { language, setLocale } = useLocale();

  const resolvedTheme = theme === "system" ? "light" : theme;
  const currentAccentId = accent === "default" ? "teal" : accent;
  const currentLang = language ?? "vi";

  return (
    <div className="flex flex-col gap-6">
      {/* Chủ đề hiển thị */}
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">
          Chủ đề hiển thị
        </p>
        <div className="grid grid-cols-2 gap-4">
          {(["light", "dark"] as const).map((t) => (
            <OptionCard
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                resolvedTheme === t
                  ? "border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {/* Mini preview */}
              <div
                className={`flex flex-col gap-2 rounded-lg border p-3 ${
                  t === "dark"
                    ? "border-[#0b241f] bg-[#0b241f]"
                    : "border-[#E7EEEC] bg-[#F3F7F5]"
                }`}
              >
                <div
                  className={`h-2 w-2/3 rounded-full ${
                    t === "dark" ? "bg-white/25" : "bg-[#D8E3E0]"
                  }`}
                />
                <div
                  className={`h-9 rounded-lg ${
                    t === "dark" ? "bg-[#123830]" : "bg-white"
                  }`}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`flex size-4 items-center justify-center rounded-full border-2 ${
                    resolvedTheme === t
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                >
                  {resolvedTheme === t && (
                    <span className="size-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {t === "light" ? "Sáng" : "Tối"}
                </span>
              </div>
            </OptionCard>
          ))}
        </div>
      </div>

      {/* Màu nhấn */}
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Màu nhấn</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Màu chủ đạo cho nút và trạng thái hoạt động.
        </p>
        <div className="mt-4 flex items-center gap-3">
          {accents.map((c) => (
            <Button variant="ghost"
              key={c.id}
              type="button"
              onClick={() => setAccent(c.id)}
              aria-label={c.id}
              style={{ backgroundColor: c.hex }}
              className={`flex size-9 items-center justify-center rounded-full transition-all ${
                currentAccentId === c.id
                  ? "ring-2 ring-offset-2 ring-foreground/20"
                  : ""
              }`}
            >
              {currentAccentId === c.id && (
                <Check className="size-4 text-white" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Ngôn ngữ */}
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">Ngôn ngữ</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { code: "vi", label: "Tiếng Việt", sub: "Mặc định", flag: "🇻🇳" },
            { code: "en", label: "English", sub: "English (US)", flag: "🇬🇧" },
          ].map((l) => (
            <OptionCard
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code as "vi" | "en")}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                currentLang === l.code
                  ? "border-primary"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {l.label}
                </p>
                <p className="text-xs text-muted-foreground">{l.sub}</p>
              </div>
              {currentLang === l.code && (
                <Check className="ml-auto size-4 text-primary" />
              )}
            </OptionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
