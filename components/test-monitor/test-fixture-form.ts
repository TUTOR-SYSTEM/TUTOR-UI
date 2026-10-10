import type {
  ApiTestFixture,
  CreateTestFixturePayload,
  TestFixtureFormError,
  TestFixtureFormField,
  TestFixtureFormValues,
  TestFixtureResolver,
} from "@/types";

/** Khớp `fixtureFields.key` ở gateway. */
const FIXTURE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,99}$/;

export function emptyFixtureForm(): TestFixtureFormValues {
  return {
    key: "",
    description: "",
    mode: "resolver",
    value: "",
    path: "/",
    authProfile: "admin",
    extract: "data.",
  };
}

/** Form điền sẵn từ gợi ý của bộ sinh case (resolver đoán từ route danh sách, nếu có). */
export function suggestedFixtureForm(
  key: string,
  suggestion: TestFixtureResolver | null,
): TestFixtureFormValues {
  const empty = emptyFixtureForm();
  return suggestion
    ? { ...empty, key, path: suggestion.path, authProfile: suggestion.authProfile, extract: suggestion.extract }
    : { ...empty, key, mode: "value" };
}

export function fixtureToForm(fixture: ApiTestFixture): TestFixtureFormValues {
  const { resolver } = fixture;
  return {
    key: fixture.key,
    description: fixture.description ?? "",
    mode: resolver ? "resolver" : "value",
    value: resolver ? "" : (fixture.value ?? ""),
    path: resolver?.path ?? "/",
    authProfile: resolver?.authProfile ?? "admin",
    extract: resolver?.extract ?? "data.",
  };
}

/** Kiểm tra theo `createTestFixtureSchema` ở gateway, rồi dựng payload — chỉ một trong hai nguồn
 * (`value` hoặc `resolver`) được gửi, nguồn kia đặt `null` để PATCH xoá nó đi. */
export function parseFixtureForm(
  values: TestFixtureFormValues,
):
  | { ok: true; payload: CreateTestFixturePayload }
  | { ok: false; errors: Partial<Record<TestFixtureFormField, TestFixtureFormError>> } {
  const errors: Partial<Record<TestFixtureFormField, TestFixtureFormError>> = {};
  const key = values.key.trim();
  if (!key) errors.key = "required";
  else if (!FIXTURE_KEY_PATTERN.test(key)) errors.key = "key";

  const path = values.path.trim();
  const extract = values.extract.trim();
  if (values.mode === "value") {
    if (!values.value.trim()) errors.value = "required";
  } else {
    if (!path) errors.path = "required";
    else if (!path.startsWith("/") || path.startsWith("//")) errors.path = "path";
    if (!extract) errors.extract = "required";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const description = values.description.trim();
  return {
    ok: true,
    payload: {
      key,
      ...(description ? { description } : {}),
      ...(values.mode === "value"
        ? { value: values.value.trim(), resolver: null }
        : { value: null, resolver: { method: "GET", path, authProfile: values.authProfile, extract } }),
    },
  };
}
