"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, KeyRound, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { Input } from "@/components/ui/input.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import { getErrorMessage } from "@/lib/axios";
import { useParentActions } from "@/lib/services/parent.service";
import { useParentsCopy } from "@/hooks/useParentsCopy.hook";
import { useTutorsCopy } from "@/hooks/useTutorsCopy.hook";
import { useLocale } from "@/hooks/useLocale.hook";
import { formatPersonName } from "@/lib/format/person-name";
import { buildTutorPasswordSchema } from "@/lib/validation/tutor-form.schema";
import type { ApiParent } from "@/types";

const PAGE_SIZE = 10;

/** Email giả do BE sinh khi phụ huynh không có email thật. */
const isPlaceholderEmail = (email: string | null) =>
  !email || email.endsWith("@no-email.local");

type PasswordForm = { password: string; confirm: string };

export function ParentsPage() {
  const copy = useParentsCopy();
  const tutorsCopy = useTutorsCopy();
  const { language } = useLocale();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<ApiParent | null>(null);

  const { list, setPassword } = useParentActions({
    list: { page, limit: PAGE_SIZE, search },
  });
  const payload = list.data;
  const parents = payload?.parents ?? [];
  const totalPages = payload?.pagination.totalPages ?? 1;

  const columns: DataTableColumn<ApiParent>[] = [
    {
      key: "name",
      header: copy.columns.name,
      render: (p) => (
        <span className="font-medium text-foreground">
          {formatPersonName(p.firstName, p.lastName, language) || copy.unnamed}
        </span>
      ),
    },
    {
      key: "email",
      header: copy.columns.email,
      render: (p) => (isPlaceholderEmail(p.email) ? copy.noEmail : p.email),
    },
    {
      key: "phone",
      header: copy.columns.phone,
      render: (p) => p.phone || copy.noPhone,
    },
    {
      key: "status",
      header: copy.columns.status,
      render: (p) => (
        <span className={p.isActive ? "text-emerald-600" : "text-rose-500"}>
          {p.isActive ? copy.statusActive : copy.statusInactive}
        </span>
      ),
    },
    {
      key: "actions",
      header: copy.columns.actions,
      align: "center",
      render: (p) => (
        <Button variant="outline" size="sm" onClick={() => setTarget(p)}>
          <KeyRound className="size-3.5" />
          {copy.setPassword}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        <p className="text-xs text-muted-foreground">{copy.addHint}</p>
      </div>

      <form
        className="relative max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={copy.searchPlaceholder}
          className="pl-9"
          aria-label={copy.searchPlaceholder}
        />
      </form>

      <DataTable
        data={parents}
        columns={columns}
        rowKey={(p) => p.id}
        isLoading={list.isPending}
        isError={list.isError}
        errorMessage={copy.errorMessage}
        emptyMessage={copy.emptyMessage}
      />

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {target && (
        <SetParentPasswordDialog
          key={target.id}
          parent={target}
          onClose={() => setTarget(null)}
          onSubmit={(password) =>
            setPassword.mutate(
              { id: target.id, password },
              {
                onSuccess: () => {
                  toast.success(copy.passwordDialog.toastSuccess);
                  setTarget(null);
                },
                onError: (err) =>
                  toast.error(getErrorMessage(err, copy.passwordDialog.toastError)),
              },
            )
          }
          loading={setPassword.isPending}
          validationMessages={tutorsCopy.validation}
        />
      )}
    </div>
  );
}

function SetParentPasswordDialog({
  parent,
  onClose,
  onSubmit,
  loading,
  validationMessages,
}: {
  parent: ApiParent;
  onClose: () => void;
  onSubmit: (password: string) => void;
  loading: boolean;
  validationMessages: Parameters<typeof buildTutorPasswordSchema>[0];
}) {
  const copy = useParentsCopy();
  const { language } = useLocale();
  const t = copy.passwordDialog;
  const schema = useMemo(
    () => buildTutorPasswordSchema(validationMessages, t.mismatch),
    [validationMessages, t.mismatch],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });
  const name =
    formatPersonName(parent.firstName, parent.lastName, language) || copy.unnamed;

  return (
    <Dialog
      isOpen
      icon={KeyRound}
      title={t.title}
      subtitle={`${t.subtitle} · ${name}`}
      className="max-w-md"
      cancelText={t.cancel}
      onCancel={onClose}
      submitText={t.submit}
      submitIcon={Check}
      onSubmit={handleSubmit(({ password }) => onSubmit(password))}
      loading={loading}
    >
      <form noValidate className="flex flex-col gap-4">
        <FormField label={t.passwordLabel} required error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("password")}
            placeholder={t.passwordPlaceholder}
            invalid={!!errors.password}
          />
        </FormField>
        <FormField label={t.confirmLabel} required error={errors.confirm?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
            placeholder={t.passwordPlaceholder}
            invalid={!!errors.confirm}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
