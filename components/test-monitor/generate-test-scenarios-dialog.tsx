"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Checkbox } from "@/components/ui/checkbox.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { Label } from "@/components/ui/label.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type {
  CreateTestScenarioPayload,
  GenerateDialogState,
  GenerateScenariosPayload,
  GenerateScenariosResult,
  TestFixtureResolver,
  TestScenarioCategory,
} from "@/types";
import { MethodTag } from "./test-monitor-badges";
import { SCENARIO_CATEGORIES } from "./test-scenario-form";

const HEAD_CLASS = "px-2 text-[11px] font-bold uppercase tracking-wide text-[#9AAEA9]";
/** `domain` cases can't be derived from metadata, so the generator never offers them. */
const GENERATABLE = SCENARIO_CATEGORIES.filter((c) => c !== "domain");

/** Bỏ các field chỉ dùng để hiển thị trước khi gửi `POST /test-scenarios/bulk`. */
function toPayload(scenario: GenerateScenariosResult["scenarios"][number]): CreateTestScenarioPayload {
  const payload: Partial<GenerateScenariosResult["scenarios"][number]> = { ...scenario };
  delete payload.routePath;
  delete payload.exists;
  return payload as CreateTestScenarioPayload;
}

/** Sinh case tự động: chọn loại case → "Xem trước" (gateway đọc metadata route, third-service đề
 * xuất ma trận case) → bỏ chọn case không muốn → lưu. Case đã có (trùng method + path + tên) không
 * chọn được. Liệt kê fixture mà các case dùng, kèm nút tạo fixture còn thiếu. */
export function GenerateTestScenariosDialog({
  state,
  existingFixtureKeys,
  onClose,
  onPreview,
  onSave,
  onCreateFixture,
  copy,
}: {
  /** `null` = đóng; nơi gọi đổi `key` mỗi lần mở để reset. */
  state: GenerateDialogState | null;
  /** Fixture đã có — cập nhật ngay khi tạo fixture từ dialog này. */
  existingFixtureKeys: string[];
  onClose: () => void;
  onPreview: (payload: GenerateScenariosPayload) => Promise<GenerateScenariosResult>;
  onSave: (scenarios: CreateTestScenarioPayload[]) => Promise<void>;
  onCreateFixture: (key: string, suggestion: TestFixtureResolver | null) => void;
  copy: TestMonitorDictionary;
}) {
  const [categories, setCategories] = useState<Set<TestScenarioCategory>>(
    () => new Set(state?.categories.length ? state.categories : GENERATABLE),
  );
  const [result, setResult] = useState<GenerateScenariosResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  if (!state) return null;
  const t = copy.generator;

  const toggleCategory = (category: TestScenarioCategory, on: boolean) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (on) next.add(category);
      else next.delete(category);
      return next;
    });
    setResult(null); // the preview no longer matches the choice
  };

  const preview = () => {
    if (categories.size === 0) return;
    setBusy(true);
    onPreview({ routes: state.routes ?? undefined, categories: [...categories] })
      .then((next) => {
        setResult(next);
        setSelected(new Set(next.scenarios.flatMap((s, i) => (s.exists ? [] : [i]))));
      })
      .catch(() => undefined) // already toasted
      .finally(() => setBusy(false));
  };

  const save = () => {
    if (!result) return preview();
    const chosen = result.scenarios.filter((_, i) => selected.has(i)).map(toPayload);
    if (chosen.length === 0) return;
    setBusy(true);
    onSave(chosen)
      .then(onClose)
      .catch(() => undefined)
      .finally(() => setBusy(false));
  };

  const fresh = result?.scenarios.flatMap((s, i) => (s.exists ? [] : [i])) ?? [];
  const allSelected = fresh.length > 0 && fresh.every((i) => selected.has(i));
  const toggle = (index: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });

  return (
    <Dialog
      isOpen
      icon={Sparkles}
      title={t.title}
      subtitle={t.subtitle}
      className="w-[1000px]"
      cancelText={t.cancel}
      onCancel={onClose}
      submitText={result ? t.submit(selected.size) : t.preview}
      onSubmit={save}
      loading={busy}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#16302b]">
          {state.routes ? t.scopeSome(state.routes.length) : t.scopeAll}
        </p>
        <div className="flex flex-wrap items-center gap-4" role="group" aria-label={t.categories}>
          {GENERATABLE.map((category) => (
            <div key={category} className="flex items-center gap-1.5">
              <Checkbox
                id={`gen-${category}`}
                checked={categories.has(category)}
                onCheckedChange={(on) => toggleCategory(category, on === true)}
                disabled={busy}
              />
              <Label htmlFor={`gen-${category}`} className="font-normal">
                {copy.list.category[category]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {categories.has("valid") && (
        <p className="rounded-md bg-[#FEF3C7] px-3 py-2 text-xs text-[#92400E]">{t.writeValidHint}</p>
      )}

      {result && result.fixtures.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-sm font-bold text-[#16302b]">{t.fixturesTitle}</h3>
          {result.fixtures.map((fixture) => {
            const ready = fixture.exists || existingFixtureKeys.includes(fixture.key);
            const Icon = ready ? CheckCircle2 : TriangleAlert;
            return (
              <div key={fixture.key} className="flex items-center justify-between gap-2 rounded-md border border-[#E7EEEC] px-3 py-1.5">
                <p className="flex items-center gap-2 text-sm">
                  <Icon className={cn("size-4", ready ? "text-[#0B7A6D]" : "text-[#B45309]")} />
                  <span className="font-mono font-semibold">{`{{fixture.${fixture.key}}}`}</span>
                  <span className="text-xs text-[#8AA09B]">{ready ? t.fixtureReady : t.fixtureMissing}</span>
                </p>
                {!ready && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onCreateFixture(fixture.key, fixture.suggestion)}
                    className="h-7! w-auto! gap-1 px-2.5! text-xs"
                  >
                    <Plus className="size-3" />
                    {t.createFixture(fixture.key)}
                  </Button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {result && (
        <section className="flex flex-col gap-2">
          {result.scenarios.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.noProposals}</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="gen-select-all"
                    checked={allSelected ? true : selected.size > 0 ? "indeterminate" : false}
                    onCheckedChange={(on) => setSelected(new Set(on === true ? fresh : []))}
                    disabled={busy || fresh.length === 0}
                  />
                  <Label htmlFor="gen-select-all" className="font-normal">
                    {t.selectAll}
                  </Label>
                </div>
                <p className="text-xs text-[#8AA09B]">{t.selected(selected.size, result.scenarios.length)}</p>
              </div>
              <div className="max-h-[420px] overflow-y-auto rounded-md border border-[#E7EEEC]">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-[#F7FAF9]">
                      <TableHead className={cn(HEAD_CLASS, "w-8")} />
                      <TableHead className={HEAD_CLASS}>{t.columns.request}</TableHead>
                      <TableHead className={HEAD_CLASS}>{t.columns.case}</TableHead>
                      <TableHead className={HEAD_CLASS}>{t.columns.profile}</TableHead>
                      <TableHead className={cn(HEAD_CLASS, "text-right")}>{t.columns.expected}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.scenarios.map((scenario, index) => (
                      <TableRow key={index} className={cn(scenario.exists && "opacity-50")}>
                        <TableCell className="px-2">
                          <Checkbox
                            checked={selected.has(index)}
                            onCheckedChange={(on) => toggle(index, on === true)}
                            disabled={busy || scenario.exists}
                            aria-label={`${scenario.method} ${scenario.path} · ${scenario.name}`}
                          />
                        </TableCell>
                        <TableCell className="max-w-80 px-2">
                          <div className="flex items-center gap-2">
                            <MethodTag method={scenario.method} />
                            <span className="truncate font-mono text-xs text-[#16302b]" title={scenario.path}>
                              {scenario.path}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 text-sm">
                          {scenario.name}
                          <span className="ml-1.5 text-[11px] text-[#8AA09B]">
                            · {copy.list.category[scenario.category]}
                            {scenario.exists && ` · ${t.exists}`}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 text-xs text-[#5C726D]">
                          {copy.authProfiles.label[scenario.authProfile]}
                        </TableCell>
                        <TableCell className="px-2 text-right font-mono text-sm font-bold">
                          {scenario.expectedStatus}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>
      )}
    </Dialog>
  );
}
