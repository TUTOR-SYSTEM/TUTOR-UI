import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useGet, usePut } from "@/lib/axios/query";
import type { ApiResponse, PaymentSettings, TeachingSettings } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const TUTOR_SETTINGS_QUERY_KEY = ["tutor-settings"] as const;

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Cài đặt gia sư: giảng dạy (`teaching`/`updateTeaching`) và thanh toán (`payment`/`updatePayment`). */
export function useTutorSettingsActions() {
  const teaching = useGet<ApiResponse<TeachingSettings>, TeachingSettings>(
    [...TUTOR_SETTINGS_QUERY_KEY, "teaching"],
    "/settings/teaching",
    {
      select: (raw) => unwrapApiData<TeachingSettings>(raw),
    },
  );

  const updateTeaching = usePut<ApiResponse<TeachingSettings>, TeachingSettings>(
    "/settings/teaching",
  );

  const payment = useGet<ApiResponse<PaymentSettings>, PaymentSettings>(
    [...TUTOR_SETTINGS_QUERY_KEY, "payment"],
    "/settings/payment",
    {
      select: (raw) => unwrapApiData<PaymentSettings>(raw),
    },
  );

  const updatePayment = usePut<ApiResponse<PaymentSettings>, PaymentSettings>(
    "/settings/payment",
  );

  return { teaching, updateTeaching, payment, updatePayment };
}
