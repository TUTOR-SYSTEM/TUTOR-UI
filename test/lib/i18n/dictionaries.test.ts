import { describe, expect, it } from "vitest";

import { accountsDictionary } from "@/lib/i18n/accounts.dictionary";
import { apiGapsDictionary } from "@/lib/i18n/api-gaps.dictionary";
import { appShellDictionary } from "@/lib/i18n/app-shell.dictionary";
import { authDictionary } from "@/lib/i18n/auth.dictionary";
import { classFormDictionary } from "@/lib/i18n/class-form.dictionary";
import { classesDictionary } from "@/lib/i18n/classes.dictionary";
import { commonDictionary } from "@/lib/i18n/common.dictionary";
import { curriculumDictionary } from "@/lib/i18n/curriculum.dictionary";
import { dashboardDictionary } from "@/lib/i18n/dashboard.dictionary";
import { flowRequestDictionary } from "@/lib/i18n/flow-request.dictionary";
import { flowRequestsDictionary } from "@/lib/i18n/flow-requests.dictionary";
import { loggerDictionary } from "@/lib/i18n/logger.dictionary";
import { scheduleDictionary } from "@/lib/i18n/schedule.dictionary";
import { studentSessionsDictionary } from "@/lib/i18n/student-sessions.dictionary";
import { studentsDictionary } from "@/lib/i18n/students.dictionary";
import { testMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import { transactionsDictionary } from "@/lib/i18n/transactions.dictionary";

const ALL_DICTIONARIES: Record<string, Record<string, unknown>> = {
  accounts: accountsDictionary,
  apiGaps: apiGapsDictionary,
  appShell: appShellDictionary,
  auth: authDictionary,
  classForm: classFormDictionary,
  classes: classesDictionary,
  common: commonDictionary,
  curriculum: curriculumDictionary,
  dashboard: dashboardDictionary,
  flowRequest: flowRequestDictionary,
  flowRequests: flowRequestsDictionary,
  logger: loggerDictionary,
  schedule: scheduleDictionary,
  studentSessions: studentSessionsDictionary,
  students: studentsDictionary,
  testMonitor: testMonitorDictionary,
  transactions: transactionsDictionary,
};

/**
 * Keys that are intentionally empty: the UI renders `prefix + <name> + suffix + "?"`,
 * so the suffix is blank for vi and en.
 */
const INTENTIONALLY_EMPTY = new Set([
  "flowRequests.vi.deleteDialog.descriptionSuffix",
  "flowRequests.en.deleteDialog.descriptionSuffix",
]);

/** Collect every leaf key path, e.g. "list.tableHeaders.name". */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n dictionaries", () => {
  it.each(Object.entries(ALL_DICTIONARIES))(
    "%s has the same keys in vi and en",
    (_name, dict) => {
      const vi = leafPaths(dict.vi).sort();
      const en = leafPaths(dict.en).sort();
      expect(en).toEqual(vi);
    },
  );

  it.each(Object.entries(ALL_DICTIONARIES))(
    "%s has no empty translations in vi or en",
    (_name, dict) => {
      const emptyPaths: string[] = [];
      for (const lang of ["vi", "en"] as const) {
        const entries = leafPaths(dict[lang]);
        const walk = (value: unknown, path: string) => {
          if (typeof value === "string" && value.trim() === "") {
            emptyPaths.push(`${lang}.${path}`);
          } else if (value && typeof value === "object") {
            for (const [key, child] of Object.entries(value)) {
              walk(child, path ? `${path}.${key}` : key);
            }
          }
        };
        walk(dict[lang], "");
        expect(entries.length).toBeGreaterThan(0);
      }
      const unexpected = emptyPaths.filter(
        (path) => !INTENTIONALLY_EMPTY.has(`${_name}.${path}`),
      );
      expect(unexpected).toEqual([]);
    },
  );
});
