"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiTestFixture } from "@/types";

/** Xác nhận xoá 1 fixture. `onDelete` do nơi gọi quyết định (API thật hoặc state demo). */
export function DeleteTestFixtureDialog({
  fixture,
  onClose,
  onDelete,
  copy,
}: {
  fixture: ApiTestFixture | null;
  onClose: () => void;
  onDelete: (fixture: ApiTestFixture) => Promise<void>;
  copy: TestMonitorDictionary;
}) {
  const [deleting, setDeleting] = useState(false);
  const t = copy.fixtureDelete;

  return (
    <ConfirmDialog
      open={!!fixture}
      onClose={onClose}
      loading={deleting}
      icon={Trash2}
      title={t.title}
      description={fixture ? t.description(fixture.key) : ""}
      confirmLabel={t.confirm}
      cancelLabel={copy.fixtureEditor.cancel}
      onConfirm={() => {
        if (!fixture) return;
        setDeleting(true);
        onDelete(fixture)
          .then(onClose)
          .catch(() => undefined) // already toasted
          .finally(() => setDeleting(false));
      }}
    />
  );
}
