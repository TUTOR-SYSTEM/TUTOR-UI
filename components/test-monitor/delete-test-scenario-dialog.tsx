"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog.ui";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiTestScenario } from "@/types";

/** Xác nhận xoá 1 test case. `onDelete` do trang quyết định (API thật hoặc state demo). */
export function DeleteTestScenarioDialog({
  scenario,
  onClose,
  onDelete,
  copy,
}: {
  scenario: ApiTestScenario | null;
  onClose: () => void;
  onDelete: (scenario: ApiTestScenario) => Promise<void>;
  copy: TestMonitorDictionary;
}) {
  const [deleting, setDeleting] = useState(false);
  const t = copy.deleteDialog;

  return (
    <ConfirmDialog
      open={!!scenario}
      onClose={onClose}
      loading={deleting}
      icon={Trash2}
      title={t.title}
      description={scenario ? t.description(scenario.name, scenario.method, scenario.path) : ""}
      confirmLabel={t.confirm}
      cancelLabel={copy.editor.cancel}
      onConfirm={() => {
        if (!scenario) return;
        setDeleting(true);
        onDelete(scenario)
          .then(onClose)
          .catch(() => undefined) // the page already toasted the error
          .finally(() => setDeleting(false));
      }}
    />
  );
}
