"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type {
  CreateTestFixturePayload,
  TestAuthProfile,
  TestFixtureEditorState,
  TestFixtureFormError,
  TestFixtureFormField,
  TestFixtureFormValues,
} from "@/types";
import { parseFixtureForm } from "./test-fixture-form";
import { AUTH_PROFILES } from "./test-scenario-form";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
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

/** Form thêm/sửa 1 fixture: giá trị cố định hoặc gọi API (GET path + profile + dot path). Không tự
 * gọi API — `onSave` do nơi gọi quyết định (API thật hoặc state demo). */
export function TestFixtureFormDialog({
  state,
  onClose,
  onSave,
  copy,
}: {
  /** `null` = đóng; nơi gọi đổi `key` mỗi lần mở để form bắt đầu lại từ `initial`. */
  state: TestFixtureEditorState | null;
  onClose: () => void;
  onSave: (payload: CreateTestFixturePayload, fixtureId?: string) => Promise<void>;
  copy: TestMonitorDictionary;
}) {
  const [values, setValues] = useState<TestFixtureFormValues | null>(state?.initial ?? null);
  const [errors, setErrors] = useState<Partial<Record<TestFixtureFormField, TestFixtureFormError>>>({});
  const [saving, setSaving] = useState(false);

  if (!state || !values) return null;
  const t = copy.fixtureEditor;
  const errorText = (field: TestFixtureFormField) => {
    const code = errors[field];
    return code ? t.errors[code] : undefined;
  };
  const set = <K extends keyof TestFixtureFormValues>(key: K, value: TestFixtureFormValues[K]) =>
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSubmit = () => {
    const parsed = parseFixtureForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    onSave(parsed.payload, state.fixtureId)
      .then(onClose)
      .catch(() => undefined) // already toasted; keep the form open
      .finally(() => setSaving(false));
  };

  return (
    <Dialog
      isOpen
      icon={KeyRound}
      title={state.fixtureId ? t.titleEdit : t.titleCreate}
      subtitle={t.subtitle}
      cancelText={t.cancel}
      onCancel={onClose}
      submitText={t.submit}
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
        <Field id="fx-key" label={t.fields.key} hint={t.fields.keyHint} error={errorText("key")}>
          <Input
            id="fx-key"
            value={values.key}
            onChange={(e) => set("key", e.target.value)}
            className="font-mono"
            invalid={!!errors.key}
            disabled={saving}
          />
        </Field>

        <Field id="fx-description" label={t.fields.description}>
          <Input
            id="fx-description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={saving}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <Label>{t.fields.mode}</Label>
          <div className="flex gap-2" role="radiogroup" aria-label={t.fields.mode}>
            {(["resolver", "value"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                role="radio"
                aria-checked={values.mode === mode}
                variant={values.mode === mode ? "default" : "outline"}
                size="sm"
                disabled={saving}
                onClick={() => set("mode", mode)}
                className={cn("w-auto! px-3!", values.mode === mode && "bg-[#0E9F8E]!")}
              >
                {mode === "value" ? t.fields.modeValue : t.fields.modeResolver}
              </Button>
            ))}
          </div>
        </div>

        {values.mode === "value" ? (
          <Field id="fx-value" label={t.fields.value} error={errorText("value")}>
            <Input
              id="fx-value"
              value={values.value}
              onChange={(e) => set("value", e.target.value)}
              className="font-mono"
              invalid={!!errors.value}
              disabled={saving}
            />
          </Field>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="fx-path" label={t.fields.path} error={errorText("path")}>
                <Input
                  id="fx-path"
                  value={values.path}
                  onChange={(e) => set("path", e.target.value)}
                  className="font-mono"
                  invalid={!!errors.path}
                  disabled={saving}
                />
              </Field>
              <Field id="fx-profile" label={t.fields.authProfile}>
                <Select
                  options={AUTH_PROFILES.filter((p) => p !== "none").map((p) => ({
                    value: p,
                    label: copy.authProfiles.label[p],
                  }))}
                  value={values.authProfile}
                  onValueChange={(v) => set("authProfile", v as TestAuthProfile)}
                  disabled={saving}
                />
              </Field>
            </div>
            <Field id="fx-extract" label={t.fields.extract} hint={t.fields.extractHint} error={errorText("extract")}>
              <Input
                id="fx-extract"
                value={values.extract}
                onChange={(e) => set("extract", e.target.value)}
                className="font-mono"
                invalid={!!errors.extract}
                disabled={saving}
              />
            </Field>
          </>
        )}
      </form>
    </Dialog>
  );
}
