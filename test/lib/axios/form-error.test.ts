import { renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleFormApiError } from "@/lib/axios/form-error";
import { ApiError } from "@/types";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

type FormValues = { email: string; password: string };

function setupForm() {
  const { result } = renderHook(() => useForm<FormValues>({ defaultValues: { email: "", password: "" } }));
  return result.current;
}

describe("handleFormApiError", () => {
  beforeEach(() => {
    toastError.mockClear();
  });

  it("shows a toast instead of field errors for non-422 failures", () => {
    const form = setupForm();
    handleFormApiError(new ApiError("Server down", 500), form.setError, "Fallback");
    expect(toastError).toHaveBeenCalledWith("Server down");
    expect(form.formState.errors).toEqual({});
  });

  it("uses the fallback message for non-ApiError values", () => {
    const form = setupForm();
    handleFormApiError("weird", form.setError, "Không lưu được");
    expect(toastError).toHaveBeenCalledWith("Không lưu được");
  });

  it("maps Nest `errors` entries onto matching fields", () => {
    const form = setupForm();
    handleFormApiError(
      new ApiError("Validation", 422, {
        errors: [
          { field: "email", message: "Email đã tồn tại" },
          { field: "password", message: "Quá ngắn" },
        ],
      }),
      form.setError,
      "Fallback",
    );
    expect(form.getFieldState("email").error).toMatchObject({ type: "server", message: "Email đã tồn tại" });
    expect(form.getFieldState("password").error?.message).toBe("Quá ngắn");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("skips entries without a field or a string message", () => {
    const form = setupForm();
    handleFormApiError(
      new ApiError("Validation", 422, {
        errors: [
          { field: "", message: "no field" },
          { field: "email", message: 42 as unknown as string },
        ],
      }),
      form.setError,
      "Fallback",
    );
    expect(form.getFieldState("email").error).toBeUndefined();
    // Nothing maps to a field, so the root error takes the first `errors` message.
    expect(form.getFieldState("root.serverError" as never).error?.message).toBe("no field");
  });

  it("maps zod-style `issues` paths when no `errors` are present", () => {
    const form = setupForm();
    handleFormApiError(
      new ApiError("Validation", 422, { issues: [{ path: "password", message: "Thiếu ký tự" }] }),
      form.setError,
      "Fallback",
    );
    expect(form.getFieldState("password").error?.message).toBe("Thiếu ký tự");
  });

  it("sets a root server error when a 422 has no mappable field", () => {
    const form = setupForm();
    handleFormApiError(
      new ApiError("Validation", 422, { message: "Dữ liệu không hợp lệ" }),
      form.setError,
      "Fallback",
    );
    expect(form.getFieldState("root.serverError" as never).error?.message).toBe("Dữ liệu không hợp lệ");
  });
});

describe("applyApiFieldErrors", () => {
  it("maps 422 errors onto rendered fields and reports success", async () => {
    const { applyApiFieldErrors } = await import("@/lib/axios/form-error");
    const { ApiError } = await import("@/types");
    const setError = vi.fn();
    const error = new ApiError("Dữ liệu không hợp lệ", 422, {
      errors: [
        { field: "email", message: "Email đã tồn tại" },
        { field: "username", message: "Tên đăng nhập đã tồn tại" },
      ],
    } as never);

    expect(applyApiFieldErrors(error, setError, ["email"])).toBe(true);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Email đã tồn tại" });
  });

  it("does not underline a 400 duplicate error (those are toasted instead)", async () => {
    const { applyApiFieldErrors } = await import("@/lib/axios/form-error");
    const { ApiError } = await import("@/types");
    const setError = vi.fn();
    const error = new ApiError("Dữ liệu không hợp lệ", 400, {
      errors: [{ field: "email", message: "Email đã tồn tại" }],
    } as never);

    expect(applyApiFieldErrors(error, setError, ["email"])).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it("returns false when nothing maps to a rendered field, or the error is not 422", async () => {
    const { applyApiFieldErrors } = await import("@/lib/axios/form-error");
    const { ApiError } = await import("@/types");
    const setError = vi.fn();
    const onlyUsername = new ApiError("x", 422, {
      errors: [{ field: "username", message: "taken" }],
    } as never);

    expect(applyApiFieldErrors(onlyUsername, setError, ["email"])).toBe(false);
    expect(applyApiFieldErrors(new ApiError("boom", 500), setError, ["email"])).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
