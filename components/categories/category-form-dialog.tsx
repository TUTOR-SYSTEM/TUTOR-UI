"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Save } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type Category,
  type CategoryFormValues,
  type CategoryType,
} from "./categories.data";

type CategoryFormDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  initial?: Category | null;
  /** Existing top-level categories that can be selected as a parent. */
  parentOptions: Category[];
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
  isLoading?: boolean;
};

const TYPES: CategoryType[] = ["Income", "Expense"];

const emptyValues: CategoryFormValues = {
  name: "",
  type: "Expense",
  icon: CATEGORY_ICONS[0],
  color: CATEGORY_COLORS[0],
  parent: undefined,
};

export const CategoryFormDialog = ({
  open,
  mode,
  initial,
  parentOptions,
  onClose,
  onSubmit,
  isLoading = false,
}: CategoryFormDialogProps) => {
  // The dialog is remounted each time it opens (see `key` at the call site),
  // so deriving the initial state lazily from props is enough — no sync effect.
  const [values, setValues] = useState<CategoryFormValues>(() =>
    initial
      ? {
          name: initial.name,
          type: initial.type,
          icon: initial.icon,
          color: initial.color,
          parent: initial.parent,
        }
      : emptyValues,
  );
  const [error, setError] = useState<string | null>(null);

  const availableParents = useMemo(
    () =>
      parentOptions.filter(
        (option) =>
          option.type === values.type &&
          !option.parent &&
          option.id !== initial?.id,
      ),
    [parentOptions, values.type, initial?.id],
  );

  const update = <K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!values.name.trim()) {
      setError("Category name is required.");
      return;
    }
    onSubmit({ ...values, name: values.name.trim() });
  };

  return (
    <Dialog
      isOpen={open}
      icon={mode === "add" ? Plus : Pencil}
      title={mode === "add" ? "New category" : "Edit category"}
      subtitle={
        mode === "add"
          ? "Create a category to organize your transactions."
          : "Update the details of this category."
      }
      cancelText="Cancel"
      onCancel={onClose}
      submitText={
        isLoading ? "Saving…" : mode === "add" ? "Create" : "Save changes"
      }
      submitIcon={mode === "add" ? Plus : Save}
      onSubmit={submit}
      loading={isLoading}
    >
      <form
        id="category-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="category-name" className="text-sm font-medium">
            Name
          </label>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-lg"
              style={{ backgroundColor: `${values.color}22` }}
            >
              {values.icon}
            </span>
            <Input
              id="category-name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Groceries"
              invalid={Boolean(error)}
              autoFocus
            />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Type</span>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((type) => {
              const active = values.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    update("type", type);
                    update("parent", undefined);
                  }}
                  className={cn(
                    "h-10 rounded-md border text-sm font-medium transition-colors",
                    active
                      ? type === "Income"
                        ? "border-positive bg-positive/10 text-positive"
                        : "border-negative bg-negative/10 text-negative"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Icon</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ICONS.map((icon) => {
              const active = values.icon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => update("icon", icon)}
                  className={cn(
                    "grid size-9 place-items-center rounded-md border text-lg transition-colors hover:bg-muted",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-transparent",
                  )}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_COLORS.map((color) => {
              const active = values.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={`Color ${color}`}
                  onClick={() => update("color", color)}
                  className={cn(
                    "size-7 rounded-full transition-transform",
                    active && "ring-2 ring-offset-2 ring-offset-card",
                  )}
                  style={{
                    backgroundColor: color,
                    boxShadow: active ? `0 0 0 2px ${color}` : undefined,
                  }}
                />
              );
            })}
            <input
              type="color"
              aria-label="Custom color"
              value={values.color}
              onChange={(event) => update("color", event.target.value)}
              className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="category-parent" className="text-sm font-medium">
            Parent category{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <select
            id="category-parent"
            value={values.parent ?? ""}
            onChange={(event) =>
              update("parent", event.target.value || undefined)
            }
            className="h-10 w-full rounded-md border border-input bg-surface-container-lowest px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50 dark:bg-input/30"
            disabled={availableParents.length === 0}
          >
            <option value="">None (top-level)</option>
            {availableParents.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Dialog>
  );
};
