import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiError } from "@/types";
import { getErrorMessage, getValidationMessages } from "./api-error";

export function handleFormApiError<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fallbackMessage: string,
) {
  if (!(error instanceof ApiError) || error.statusCode !== 422) {
    toast.error(getErrorMessage(error, fallbackMessage));
    return;
  }

  const nestErrors = error.data?.errors ?? [];
  const issues = error.data?.issues ?? [];
  let mappedFieldCount = 0;

  nestErrors.forEach((entry) => {
    const field = entry.field;
    const message = entry.message;
    if (!field || typeof message !== "string") {
      return;
    }
    mappedFieldCount += 1;
    setError(field as Path<TFieldValues>, {
      type: "server",
      message,
    });
  });

  issues.forEach((issue) => {
    const field = issue.path;
    const message = issue.message;

    if (!field || typeof message !== "string") {
      return;
    }

    mappedFieldCount += 1;
    setError(field as Path<TFieldValues>, {
      type: "server",
      message,
    });
  });

  if (mappedFieldCount === 0) {
    const fallbackValidationMessage =
      getValidationMessages(error)[0] || "Validation failed";

    setError("root.serverError" as Path<TFieldValues>, {
      type: "server",
      message: fallbackValidationMessage,
    });
  }
}

/**
 * Inline (underline) errors are for 422 validation only: maps `errors[]` onto the rendered fields
 * (`fields`) without toasting. Returns `true` when at least one error landed on a visible field.
 */
export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fields: readonly string[],
): boolean {
  if (!(error instanceof ApiError) || error.statusCode !== 422) {
    return false;
  }
  let mapped = 0;
  for (const entry of error.data?.errors ?? []) {
    const field = entry.field;
    const message = entry.message;
    if (!field || typeof message !== "string" || !fields.includes(field)) {
      continue;
    }
    setError(field as Path<TFieldValues>, { type: "server", message });
    mapped += 1;
  }
  return mapped > 0;
}

/** Human-readable detail for a toast: the first `errors[].message` when the BE sent one, else the top-level message. */
export function apiErrorDetail(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const first = error.data?.errors?.find(
      (e) => typeof e.message === "string" && e.message.length > 0,
    );
    if (first?.message) return first.message;
  }
  return getErrorMessage(error, fallback);
}

/**
 * Error handler for tutor-style forms. 422 with a rendered field → inline underline on that
 * field. Everything else (400 duplicates, 401, 5xx, 422 on an unrendered field) → toast with the
 * BE detail message.
 */
export function showFormApiError<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fields: readonly string[],
  fallback: string,
): void {
  if (applyApiFieldErrors(error, setError, fields)) return;
  toast.error(apiErrorDetail(error, fallback));
}
