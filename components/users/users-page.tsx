"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Search, ShieldOff, Trash2 } from "lucide-react";

import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog, type ManagedUser } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ROLE_COLOR, ROLE_LABEL } from "./role-options";
import { useGet, useDelete } from "@/lib/axios/query";
import { useUserActions } from "@/lib/services/user.service";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import type {
  ApiManagedUser,
  ManagedUserRole,
  ManagedUsersApiPayload,
} from "@/types";

function initials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  return (f + l).toUpperCase() || "U";
}

function mapApiToManagedUser(api: ApiManagedUser): ManagedUser {
  return {
    id: api.id,
    firstName: api.firstName ?? "",
    lastName: api.lastName ?? "",
    email: api.email ?? "",
    phone: api.phone ?? "",
    role: api.role,
    isActive: api.isActive,
    createdAt: api.createdAt ?? "",
  };
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

const ROLE_TABS: { label: string; value: "" | ManagedUserRole }[] = [
  { label: "Tất cả", value: "" },
  { label: "Quản trị viên", value: "ADMIN" },
  { label: "Gia sư", value: "TUTOR" },
  { label: "Học sinh", value: "STUDENT" },
  { label: "Phụ huynh", value: "PARENT" },
];

const DEFAULT_PAGE_SIZE = 10;
const USERS_QUERY_KEY = ["users", "list"] as const;

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Lọc theo vai trò",
    body: "Chọn thẻ Quản trị viên, Gia sư, Học sinh hoặc Phụ huynh để thu hẹp danh sách, hoặc gõ tên/email vào ô tìm kiếm.",
  },
  {
    n: 2,
    title: "Thêm người dùng",
    body: (
      <>
        Nhấn{" "}
        <span className="font-semibold text-[#0E9F8E]">Thêm người dùng</span> để
        tạo tài khoản mới với vai trò bất kỳ.
      </>
    ),
  },
  {
    n: 3,
    title: "Đổi trạng thái",
    body: "Nhấn nhãn Hoạt động/Ngừng hoạt động trên mỗi dòng để khóa hoặc mở lại tài khoản (không tự khóa được chính mình).",
  },
  {
    n: 4,
    title: "Sửa / xoá",
    body: "Dùng biểu tượng bút chì để sửa thông tin, biểu tượng thùng rác để xoá người dùng.",
  },
];

export function UsersPage() {
  const role = useCurrentUserRole();
  const currentUserId = useCurrentUserId();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"" | ManagedUserRole>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });

  const params: Record<string, unknown> = { page, limit: pageSize };
  if (search.trim()) params.search = search.trim();
  if (activeTab) params.role = activeTab;

  const {
    data: apiPayload,
    isPending,
    isError,
    error,
  } = useGet<unknown, ManagedUsersApiPayload>(
    [...USERS_QUERY_KEY, page, pageSize, search, activeTab],
    "/users",
    {
      params,
      select: (raw) => unwrapApiData<ManagedUsersApiPayload>(raw),
      enabled: role === "ADMIN",
    },
  );

  const users = useMemo(
    () => (apiPayload?.data ?? []).map(mapApiToManagedUser),
    [apiPayload],
  );

  const pagination = apiPayload?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalUsers = pagination?.total ?? 0;

  const deleteUser = useDelete<unknown, string>((id) => `/users/${id}`, {
    onSuccess: () => {
      invalidate();
      toast.success("Xóa người dùng thành công!");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Xóa thất bại")),
  });

  const { toggleStatus } = useUserActions();

  const handleDelete = (id: string) => {
    deleteUser.mutate(id, { onSuccess: () => setDeletingUser(null) });
  };

  const handleToggleStatus = (user: ManagedUser) => {
    const turningOff = user.isActive;
    if (
      turningOff &&
      !window.confirm(
        `Khóa tài khoản của ${user.firstName} ${user.lastName}? Người này sẽ không thể đăng nhập.`,
      )
    ) {
      return;
    }
    toggleStatus.mutate(
      { id: user.id, isActive: !user.isActive },
      {
        onSuccess: () => {
          invalidate();
          toast.success("Cập nhật trạng thái thành công!");
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, "Cập nhật trạng thái thất bại")),
      },
    );
  };

  const columns: DataTableColumn<ManagedUser>[] = [
    {
      key: "stt",
      header: "STT",
      headerClassName:
        "w-14 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]",
      cellClassName: "px-4 py-3.5 font-medium text-[#9AAEA9]",
      render: (_u, i) =>
        String((page - 1) * pageSize + i + 1).padStart(2, "0"),
    },
    {
      key: "user",
      header: "NGƯỜI DÙNG",
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]",
      cellClassName: "px-4 py-3.5",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "#0E9F8E" }}
          >
            {initials(u.firstName, u.lastName)}
          </span>
          <div>
            <p className="font-semibold text-[#16302b] leading-tight">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-[#8AA09B] mt-0.5">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "VAI TRÒ",
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]",
      cellClassName: "px-4 py-3.5",
      render: (u) => {
        const roleColor = ROLE_COLOR[u.role];
        return (
          <span
            className="rounded-md px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: roleColor.bg, color: roleColor.text }}
          >
            {ROLE_LABEL[u.role]}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "TRẠNG THÁI",
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]",
      cellClassName: "px-4 py-3.5",
      render: (u) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleToggleStatus(u)}
          disabled={toggleStatus.isPending || u.id === currentUserId}
          title={
            u.id === currentUserId
              ? "Không thể tự khóa tài khoản của chính mình"
              : "Bấm để đổi trạng thái"
          }
          className={cn(
            "h-auto! w-auto! rounded-md px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60",
            u.isActive
              ? "bg-[#E4F6EF]! text-[#0B7A6D] hover:bg-[#E4F6EF]!"
              : "bg-[#FEE2E2]! text-[#DC2626] hover:bg-[#FEE2E2]!",
          )}
        >
          {u.isActive ? "Hoạt động" : "Ngừng hoạt động"}
        </Button>
      ),
    },
    {
      key: "createdAt",
      header: "NGÀY TẠO",
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]",
      cellClassName: "px-4 py-3.5 text-[#16302b]",
      render: (u) => formatDate(u.createdAt),
    },
    {
      key: "actions",
      header: "THAO TÁC",
      headerClassName:
        "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]",
      cellClassName: "px-4 py-3.5",
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Chỉnh sửa"
            onClick={() => setEditingUser(u)}
            className="rounded-md text-[#8AA09B] hover:bg-[#E4F6EF] hover:text-[#0E9F8E]"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={
              u.id === currentUserId ? "Không thể tự xóa chính mình" : "Xóa"
            }
            onClick={() => setDeletingUser(u)}
            disabled={u.id === currentUserId}
            className="rounded-md text-[#8AA09B] hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#8AA09B]"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#E7EEEC] bg-white py-24 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#FFF0E6]">
          <ShieldOff className="size-6 text-[#E85D24]" />
        </span>
        <h2 className="text-lg font-bold text-[#16302b]">
          Không có quyền truy cập
        </h2>
        <p className="max-w-sm text-sm text-[#8AA09B]">
          Chỉ quản trị viên mới có thể xem và quản lý danh sách người dùng.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#16302b]">Người dùng</h1>
          <span className="rounded-full bg-[#E4F6EF] px-3 py-0.5 text-sm font-semibold text-[#0E9F8E]">
            {totalUsers} người dùng
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#9AAEA9]" />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, email..."
              className="h-9! w-56 rounded-lg border-[#E7EEEC] bg-white pl-9 pr-3 text-sm text-[#16302b] placeholder:text-[#9AAEA9] focus-visible:border-[#0E9F8E] focus-visible:ring-2 focus-visible:ring-[#0E9F8E]/30"
            />
          </div>
          <Button
            type="button"
            size={"lg"}
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "#0E9F8E" }}
          >
            <Plus className="size-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_TABS.map((tab) => (
          <Button
            key={tab.value || "all"}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={cn(
              "h-auto! w-auto! rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-[#0E9F8E]! text-white shadow-sm hover:bg-[#0E9F8E]!"
                : "border border-[#E7EEEC] bg-white text-[#16302b] hover:border-[#0E9F8E]/40 hover:bg-white hover:text-[#0E9F8E]",
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        <div className="overflow-hidden rounded-t-xl">
          <DataTable
            data={users}
            columns={columns}
            rowKey={(u) => u.id}
            isLoading={isPending}
            isError={isError}
            errorMessage={getErrorMessage(
              error,
              "Không thể tải danh sách người dùng.",
            )}
            emptyMessage="Không tìm thấy người dùng phù hợp."
            headerRowClassName="border-b border-[#E7EEEC] bg-[#F3F7F5]"
            rowClassName="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9]"
            pageSize={pageSize}
          />
        </div>

        {/* Kept outside the overflow-hidden table wrapper so the page-size
            dropdown isn't clipped */}
        <div className="border-t border-[#EEF3F1] px-4 py-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          invalidate();
          setPage(1);
        }}
      />

      <EditUserDialog
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={invalidate}
      />

      <DeleteUserDialog
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
      />

      <UsageGuides steps={USAGE_GUIDE_STEPS} />
    </div>
  );
}
