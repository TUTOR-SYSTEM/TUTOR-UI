"use client";

import { CheckCircle2, KeyRound, Pencil, Plus, RefreshCw, Trash2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import { formatDateTime } from "@/components/logger/logger-utils";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiAuthProfileStatus, ApiTestFixture } from "@/types";

const COLUMN_COUNT = 4;
const HEAD_CLASS = "px-3 text-[11px] font-bold uppercase tracking-wide text-[#9AAEA9]";

/** "Fixture & tài khoản test": trạng thái tài khoản theo role (đọc từ env third-service, chỉ hiện
 * email) và danh sách fixture `{{fixture.<key>}}` — thêm/sửa/xoá, resolve lại fixture gọi API. */
export function TestFixturesDialog({
  open,
  fixtures,
  authProfiles,
  isLoading,
  isError,
  resolvingId,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  onResolve,
  copy,
}: {
  open: boolean;
  fixtures: ApiTestFixture[];
  authProfiles: ApiAuthProfileStatus[];
  isLoading: boolean;
  isError: boolean;
  /** Fixture đang resolve — nút của nó quay spinner. */
  resolvingId: string | null;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (fixture: ApiTestFixture) => void;
  onDelete: (fixture: ApiTestFixture) => void;
  onResolve: (fixture: ApiTestFixture) => void;
  copy: TestMonitorDictionary;
}) {
  if (!open) return null;
  const t = copy.fixtures;

  return (
    <Dialog
      isOpen
      icon={KeyRound}
      title={t.title}
      subtitle={t.subtitle}
      className="w-[880px]"
      cancelText={t.close}
      onCancel={onClose}
      submitText={t.close}
      onSubmit={onClose}
    >
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-[#16302b]">{t.accountsTitle}</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {authProfiles.map((account) => {
            const Icon = account.configured ? CheckCircle2 : XCircle;
            return (
              <div
                key={account.profile}
                className="flex items-start gap-2 rounded-lg border border-[#E7EEEC] px-3 py-2"
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    account.configured ? "text-[#0B7A6D]" : "text-[#C2412B]",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#16302b]">
                    {copy.authProfiles.label[account.profile]}
                  </p>
                  <p className="truncate text-xs text-[#8AA09B]">
                    {account.configured && account.email
                      ? t.accountConfigured(account.email)
                      : t.accountMissing(`TEST_ACCOUNT_${account.profile.toUpperCase()}`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#16302b]">{t.fixturesTitle}</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onAdd}
            className="h-8! w-auto! gap-1.5 px-3! text-[#0B7A6D]!"
          >
            <Plus className="size-3.5" />
            {t.add}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={HEAD_CLASS}>{t.columns.key}</TableHead>
              <TableHead className={HEAD_CLASS}>{t.columns.source}</TableHead>
              <TableHead className={HEAD_CLASS}>{t.columns.value}</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right")}>
                <span className="sr-only">{t.columns.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-[#C2412B]">
                  {t.error}
                </TableCell>
              </TableRow>
            )}
            {!isError && isLoading && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
                  {t.loading}
                </TableCell>
              </TableRow>
            )}
            {!isError && !isLoading && fixtures.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
                  {t.empty}
                </TableCell>
              </TableRow>
            )}
            {!isError &&
              !isLoading &&
              fixtures.map((fixture) => {
                const { resolver } = fixture;
                const resolvedAt = fixture.resolvedAt ? formatDateTime(fixture.resolvedAt) : null;
                return (
                  <TableRow key={fixture.id}>
                    <TableCell className="px-3 align-top">
                      <p className="font-mono text-sm font-semibold text-[#16302b]">{fixture.key}</p>
                      {fixture.description && (
                        <p className="mt-0.5 text-xs text-[#8AA09B]">{fixture.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-64 px-3 align-top">
                      <p className="truncate font-mono text-xs text-[#5C726D]">
                        {resolver
                          ? t.sourceResolver(
                              copy.authProfiles.label[resolver.authProfile],
                              resolver.path,
                              resolver.extract,
                            )
                          : t.sourceValue}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-56 px-3 align-top">
                      {fixture.value ? (
                        <p className="truncate font-mono text-xs font-bold text-[#16302b]" title={fixture.value}>
                          {fixture.value}
                        </p>
                      ) : (
                        <p className="text-xs text-[#B45309]">{t.notResolved}</p>
                      )}
                      {resolver && resolvedAt && (
                        <p className="mt-0.5 text-[11px] text-[#8AA09B]">
                          {t.resolvedAt(`${resolvedAt.date} ${resolvedAt.time}`)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-3 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        {resolver && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={t.resolve}
                            title={t.resolve}
                            loading={resolvingId === fixture.id}
                            disabled={resolvingId !== null}
                            onClick={() => onResolve(fixture)}
                          >
                            <RefreshCw className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t.edit(fixture.key)}
                          onClick={() => onEdit(fixture)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t.delete(fixture.key)}
                          onClick={() => onDelete(fixture)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </section>
    </Dialog>
  );
}
