import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { showFormApiError } from "@/lib/axios/form-error";
import { ApiError } from "@/types";

describe("showFormApiError", () => {
  beforeEach(() => {
    toast.error.mockReset();
  });

  it("underlines the field for a 422 and does not toast", () => {
    const setError = vi.fn();
    const error = new ApiError("Dữ liệu không hợp lệ", 422, {
      errors: [{ field: "email", message: "Email không hợp lệ" }],
    } as never);

    showFormApiError(error, setError, ["email"], "fallback");

    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Email không hợp lệ" });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts the BE detail for a 400 duplicate, without underlining", () => {
    const setError = vi.fn();
    const error = new ApiError("Dữ liệu không hợp lệ", 400, {
      errors: [{ field: "email", message: "Email đã tồn tại" }],
    } as never);

    showFormApiError(error, setError, ["email"], "fallback");

    expect(setError).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Email đã tồn tại");
  });

  it("toasts the fallback when the error has no detail", () => {
    showFormApiError(new Error("network down"), vi.fn(), ["email"], "Thêm gia sư thất bại");
    expect(toast.error).toHaveBeenCalledWith("network down");
  });

  it("toasts a 422 whose field is not rendered", () => {
    const setError = vi.fn();
    const error = new ApiError("Dữ liệu không hợp lệ", 422, {
      errors: [{ field: "username", message: "Tên đăng nhập đã tồn tại" }],
    } as never);

    showFormApiError(error, setError, ["email"], "fallback");

    expect(setError).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Tên đăng nhập đã tồn tại");
  });
});
