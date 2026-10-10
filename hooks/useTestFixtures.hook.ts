"use client";

import { useState } from "react";
import { toast } from "sonner";

import { MOCK_AUTH_PROFILES, MOCK_FIXTURES } from "@/components/test-monitor/test-monitor-mock-data";
import { useTestMonitorCopy } from "@/hooks/useTestMonitorCopy.hook";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useTestScenarioActions } from "@/lib/services/test-scenario.service";
import type { ApiTestFixture, CreateTestFixturePayload } from "@/types";

/** Fixture + trạng thái tài khoản test của trang `/test-monitor`. `mock` (chế độ demo): đọc/ghi
 * state cục bộ từ `MOCK_FIXTURES`, không gọi API. Các thao tác ghi tự toast; lỗi thì toast rồi
 * reject để dialog giữ nguyên dữ liệu đang nhập. */
export function useTestFixtures({ mock, fixturesEnabled }: { mock: boolean; fixturesEnabled: boolean }) {
  const copy = useTestMonitorCopy();
  const [mockFixtures, setMockFixtures] = useState<ApiTestFixture[]>(MOCK_FIXTURES);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const actions = useTestScenarioActions({
    fixtures: true,
    fixturesOptions: { enabled: fixturesEnabled && !mock },
    authProfiles: true,
    authProfilesOptions: { enabled: !mock },
    metaOptions: { enabled: false },
  });

  const fail = (fallback: string) => (err: unknown) => {
    toast.error(getErrorMessage(err, fallback));
    throw err;
  };

  const save = async (payload: CreateTestFixturePayload, fixtureId?: string) => {
    if (mock) {
      const now = new Date().toISOString();
      const fields = {
        key: payload.key,
        description: payload.description ?? null,
        value: payload.value ?? null,
        resolver: payload.resolver ?? null,
      };
      setMockFixtures((prev) =>
        fixtureId
          ? prev.map((f) => (f.id === fixtureId ? { ...f, ...fields, updatedAt: now } : f))
          : [...prev, { ...fields, id: `mock-fx-${Date.now()}`, resolvedAt: null, createdAt: now, updatedAt: null }],
      );
    } else if (fixtureId) {
      await actions.updateFixture.mutateAsync({ id: fixtureId, ...payload }).catch(fail(copy.fixtureEditor.saveError));
    } else {
      await actions.createFixture.mutateAsync(payload).catch(fail(copy.fixtureEditor.saveError));
    }
    toast.success(fixtureId ? copy.fixtureEditor.saved(payload.key) : copy.fixtureEditor.created(payload.key));
  };

  const remove = async (fixture: ApiTestFixture) => {
    if (mock) setMockFixtures((prev) => prev.filter((f) => f.id !== fixture.id));
    else await actions.deleteFixture.mutateAsync(fixture.id).catch(fail(copy.fixtureDelete.error));
    toast.success(copy.fixtureDelete.deleted(fixture.key));
  };

  const resolve = (fixture: ApiTestFixture) => {
    if (mock) {
      const resolvedAt = new Date().toISOString();
      setMockFixtures((prev) => prev.map((f) => (f.id === fixture.id ? { ...f, resolvedAt } : f)));
      toast.success(copy.fixtures.resolved(fixture.key, fixture.value ?? ""));
      return;
    }
    setResolvingId(fixture.id);
    actions.resolveFixture.mutate(fixture.id, {
      onSuccess: (raw) => {
        const row = unwrapApiData<ApiTestFixture>(raw);
        toast.success(copy.fixtures.resolved(row.key, row.value ?? ""));
      },
      onError: (err) => toast.error(getErrorMessage(err, copy.fixtures.resolveError)),
      onSettled: () => setResolvingId(null),
    });
  };

  return {
    fixtures: mock ? mockFixtures : (actions.fixtures.data ?? []),
    isLoading: !mock && actions.fixtures.isLoading,
    isError: !mock && actions.fixtures.isError,
    authProfiles: mock ? MOCK_AUTH_PROFILES : (actions.authProfiles.data ?? []),
    resolvingId,
    save,
    remove,
    resolve,
  };
}
