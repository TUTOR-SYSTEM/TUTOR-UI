"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type {
  ApiAuthProfileStatus,
  ApiRoute,
  CreateTestScenarioPayload,
  ScenarioFormError,
  ScenarioFormField,
  TestAuthProfile,
  TestScenarioCategory,
  TestScenarioEditorState,
  TestScenarioFormValues,
  TestScenarioMethod,
} from "@/types";
import {
  AUTH_PROFILES,
  DEFAULT_STATUS_BY_CATEGORY,
  SCENARIO_CATEGORIES,
  SCENARIO_METHODS,
  SCENARIO_SERVICES,
  parseScenarioForm,
} from "./test-scenario-form";

const TEXTAREA_CLASS =
  "w-full resize-y rounded-md border border-input bg-surface-container-lowest px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary aria-invalid:border-destructive";
const ROUTE_LIST_ID = "test-scenario-route-paths";

function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Dialog tạo/sửa 1 test case. Không tự gọi API — `onSave` do trang quyết định (API thật hoặc
 * state demo); dialog chỉ kiểm tra form, dựng payload và hiện trạng thái đang lưu. */
export function TestScenarioFormDialog({
  state,
  routes,
  authProfiles,
  onClose,
  onSave,
  copy,
}: {
  /** `null` = đóng. Đổi `state` (mở dialog khác) thì mount lại form qua `key` ở nơi gọi. */
  state: TestScenarioEditorState | null;
  /** Route thật của gateway — gợi ý cho ô Path. */
  routes: ApiRoute[];
  /** Tài khoản test nào đã cấu hình — đánh dấu "chưa cấu hình" trong ô chọn profile. */
  authProfiles: ApiAuthProfileStatus[];
  onClose: () => void;
  onSave: (payload: CreateTestScenarioPayload, scenarioId?: string) => Promise<void>;
  copy: TestMonitorDictionary;
}) {
  const [values, setValues] = useState<TestScenarioFormValues | null>(state?.initial ?? null);
  const [errors, setErrors] = useState<Partial<Record<ScenarioFormField, ScenarioFormError>>>({});
  const [saving, setSaving] = useState(false);

  if (!state || !values) return null;
  const t = copy.editor;
  const errorText = (field: ScenarioFormField) => {
    const code = errors[field];
    return code ? t.errors[code] : undefined;
  };
  const set = <K extends keyof TestScenarioFormValues>(key: K, value: TestScenarioFormValues[K]) =>
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));

  const changeCategory = (category: TestScenarioCategory) =>
    setValues((prev) => {
      if (!prev) return prev;
      // Keep a status the user typed; only follow the category while it still holds the default.
      const wasDefault = prev.expectedStatus === String(DEFAULT_STATUS_BY_CATEGORY[prev.category]);
      return {
        ...prev,
        category,
        expectedStatus: wasDefault
          ? String(DEFAULT_STATUS_BY_CATEGORY[category])
          : prev.expectedStatus,
      };
    });

  const handleSubmit = () => {
    const parsed = parseScenarioForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    onSave(parsed.payload, state.mode === "edit" ? state.scenarioId : undefined)
      .then(onClose)
      .catch(() => undefined) // the page already toasted the error; keep the form open
      .finally(() => setSaving(false));
  };

  const profileOptions = AUTH_PROFILES.map((profile) => {
    const status = authProfiles.find((a) => a.profile === profile);
    const label = copy.authProfiles.label[profile];
    return {
      value: profile,
      label: status && !status.configured ? `${label} (${copy.authProfiles.notConfigured})` : label,
    };
  });
  const routePaths = [...new Set(routes.filter((r) => r.method === values.method).map((r) => r.path))];

  return (
    <Dialog
      isOpen
      icon={FlaskConical}
      title={state.mode === "edit" ? t.titleEdit : t.titleCreate}
      subtitle={t.subtitle}
      className="w-[760px]"
      cancelText={t.cancel}
      onCancel={onClose}
      submitText={state.mode === "edit" ? t.submitEdit : t.submitCreate}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
          <Field id="ts-method" label={t.fields.method}>
            <Select
              options={SCENARIO_METHODS.map((m) => ({ label: m, value: m }))}
              value={values.method}
              onValueChange={(v) => set("method", v as TestScenarioMethod)}
              disabled={saving}
            />
          </Field>
          <Field id="ts-path" label={t.fields.path} hint={t.fields.pathHint} error={errorText("path")}>
            <Input
              id="ts-path"
              value={values.path}
              onChange={(e) => set("path", e.target.value)}
              list={ROUTE_LIST_ID}
              autoComplete="off"
              className="font-mono"
              invalid={!!errors.path}
              disabled={saving}
            />
            <datalist id={ROUTE_LIST_ID}>
              {routePaths.map((path) => (
                <option key={path} value={path} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="ts-name" label={t.fields.name} error={errorText("name")}>
            <Input
              id="ts-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t.fields.namePlaceholder}
              maxLength={200}
              invalid={!!errors.name}
              disabled={saving}
            />
          </Field>
          <Field id="ts-service" label={t.fields.service} error={errorText("service")}>
            <Select
              options={[...new Set([...SCENARIO_SERVICES, values.service])].map((s) => ({
                label: s,
                value: s,
              }))}
              value={values.service}
              onValueChange={(v) => set("service", v)}
              invalid={!!errors.service}
              disabled={saving}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="ts-category" label={t.fields.category}>
            <Select
              options={SCENARIO_CATEGORIES.map((c) => ({ label: copy.list.category[c], value: c }))}
              value={values.category}
              onValueChange={(v) => changeCategory(v as TestScenarioCategory)}
              disabled={saving}
            />
          </Field>
          <Field id="ts-status" label={t.fields.expectedStatus} error={errorText("expectedStatus")}>
            <Input
              id="ts-status"
              type="number"
              min={100}
              max={599}
              value={values.expectedStatus}
              onChange={(e) => set("expectedStatus", e.target.value)}
              className="font-mono"
              invalid={!!errors.expectedStatus}
              disabled={saving}
            />
          </Field>
        </div>

        <Field id="ts-profile" label={t.fields.authProfile} hint={t.fields.authProfileHint}>
          <Select
            options={profileOptions}
            value={values.authProfile}
            onValueChange={(v) => set("authProfile", v as TestAuthProfile)}
            disabled={saving}
          />
        </Field>

        <Field id="ts-description" label={t.fields.description}>
          <textarea
            id="ts-description"
            rows={2}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={saving}
            className={cn(TEXTAREA_CLASS, "font-sans text-sm")}
          />
        </Field>

        <p className="rounded-md bg-[#F1FBF9] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#0B7A6D]">
          {t.fields.variables}
        </p>

        <Field id="ts-headers" label={t.fields.headers} hint={t.fields.headersHint} error={errorText("headers")}>
          <textarea
            id="ts-headers"
            rows={3}
            spellCheck={false}
            value={values.headers}
            onChange={(e) => set("headers", e.target.value)}
            aria-invalid={!!errors.headers}
            disabled={saving}
            className={TEXTAREA_CLASS}
          />
        </Field>

        <Field id="ts-body" label={t.fields.body} hint={t.fields.bodyHint} error={errorText("body")}>
          <textarea
            id="ts-body"
            rows={6}
            spellCheck={false}
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            aria-invalid={!!errors.body}
            disabled={saving}
            className={TEXTAREA_CLASS}
          />
        </Field>
      </form>
    </Dialog>
  );
}
