"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Palette,
  GraduationCap,
  CreditCard,
  Camera,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  Loader2,
  QrCode,
  Download,
  Copy,
} from "lucide-react";

import { axiosInstance, getErrorMessage } from "@/lib/axios";
import { apiGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useAuthStore } from "@/zustand/auth.store";
import type { ApiUser, UpdateUserPayload } from "@/types";
import Image from "next/image";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useUserActions } from "@/lib/services/user.service";
import { apiUploadFile } from "@/lib/services/student.service";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import type { UserRole } from "@/lib/rbac/roles";
import { useTheme } from "@/components/providers/theme.provider";
import { useColorTheme } from "@/components/providers/color-theme.provider";
import { useLocale } from "@/hooks/useLocale.hook";
import type { ColorThemeSelection } from "@/lib/color-themes";

/* ─── Types ─── */
type Tab =
  | "profile"
  | "security"
  | "notifications"
  | "appearance"
  | "classes"
  | "fees";

/* ─── Tab config ─── */
const TABS: {
  id: Tab;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    id: "profile",
    label: "Hồ sơ cá nhân",
    icon: User,
    desc: "Thông tin và ảnh đại diện",
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: Lock,
    desc: "Mật khẩu và xác thực",
  },
  {
    id: "notifications",
    label: "Thông báo",
    icon: Bell,
    desc: "Tuỳ chọn nhận thông báo",
  },
  {
    id: "appearance",
    label: "Giao diện & Ngôn ngữ",
    icon: Palette,
    desc: "Tuỳ chỉnh cách bảng điều khiển hiển thị.",
  },
  {
    id: "classes",
    label: "Giảng dạy",
    icon: GraduationCap,
    desc: "Thiết lập mặc định áp dụng khi tạo buổi học và lớp mới.",
  },
  {
    id: "fees",
    label: "Thanh toán",
    icon: CreditCard,
    desc: "Tài khoản nhận học phí từ phụ huynh.",
  },
];

/**
 * Tab nào role nào được xem — `null` = mọi role đã đăng nhập. SSOT ngay tại
 * đây (không tách route riêng) vì `/settings` là route dùng chung, khớp tinh
 * thần bảng `ROUTE_ACCESS` (`@/lib/rbac/route-access`). "Lớp học" và "Học phí"
 * là cài đặt công việc dạy — chỉ TUTOR mới cấu hình, ADMIN/STUDENT/PARENT
 * không có gì để cấu hình ở hai tab này.
 */
const TAB_ACCESS: Record<Tab, readonly UserRole[] | null> = {
  profile: null,
  security: null,
  notifications: null,
  appearance: null,
  classes: ["TUTOR"],
  fees: ["TUTOR"],
};

function TextInput({
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  value?: string;
  placeholder?: string;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const readOnly = !onChange;
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`h-10 w-full rounded-lg border px-3 text-sm placeholder:text-[#9AAEA9] transition-colors ${
        readOnly
          ? "cursor-not-allowed border-[#E7EEEC] bg-[#F3F7F5] text-[#5c726d]"
          : "border-[#E7EEEC] bg-white text-[#16302b] focus:border-[#0E9F8E] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]/20"
      }`}
    />
  );
}

function Textarea({
  value,
  placeholder,
  rows = 3,
  onChange,
}: {
  value?: string;
  placeholder?: string;
  rows?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-lg border border-[#E7EEEC] bg-white px-3 py-2.5 text-sm text-[#16302b] placeholder:text-[#9AAEA9] focus:border-[#0E9F8E] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]/20 transition-colors"
    />
  );
}

function Toggle({
  defaultChecked = false,
  label,
  desc,
}: {
  defaultChecked?: boolean;
  label: string;
  desc?: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-[#16302b]">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-[#9AAEA9]">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-[#0E9F8E]" : "bg-[#E7EEEC]"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

/* Label-above / input-below field — used by the TUTOR profile layout, distinct
   from the label-left FormRow pattern kept below for other roles. */
function LabelField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-[#9AAEA9]">{label}</label>
      {children}
    </div>
  );
}

/* Comma-separated "subjects" string rendered as removable tag-chips, with an
   inline "+ Thêm môn" input to append a new one. Wire format (comma-separated
   string on `form.subjects`) is unchanged — this is purely a display/edit UI. */
function SubjectsChipInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const subjects = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      onChange([...subjects, trimmed].join(", "));
    }
    setDraft("");
    setAdding(false);
  };

  const removeSubject = (subject: string) => {
    onChange(subjects.filter((s) => s !== subject).join(", "));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {subjects.map((subject) => (
        <span
          key={subject}
          className="flex items-center gap-1.5 rounded-full bg-[#E4F6EF] px-3 py-1 text-xs font-medium text-[#0B7A6D]"
        >
          {subject}
          <button
            type="button"
            onClick={() => removeSubject(subject)}
            aria-label={`Xoá ${subject}`}
            className="text-[#0B7A6D]/60 hover:text-[#0B7A6D]"
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          placeholder="Tên môn học"
          className="h-7 w-32 rounded-full border border-[#0E9F8E] bg-white px-3 text-xs text-[#16302b] focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-[#0E9F8E]/50 px-3 py-1 text-xs font-medium text-[#0E9F8E] hover:bg-[#E4F6EF]"
        >
          + Thêm môn
        </button>
      )}
    </div>
  );
}

/* Label-left / input-right row — same pattern as student detail InfoRow */
function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EEF3F1] py-3 last:border-0">
      <span className="w-36 shrink-0 text-sm text-[#9AAEA9]">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9AAEA9]">
      {children}
    </h3>
  );
}

function Divider() {
  return <hr className="my-6 border-[#EEF3F1]" />;
}

function SaveButton({ label = "Lưu thay đổi" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  const handle = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={handle}
        className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${
          saved ? "bg-[#0b7a6d]" : "bg-[#0E9F8E] hover:bg-[#0b7a6d]"
        }`}
      >
        {saved && <Check className="size-4" />}
        {saved ? "Đã lưu!" : label}
      </button>
    </div>
  );
}

/* ─── Social icons (inline SVG) ─── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  );
}

/* ─── Social accounts section ─── */
function SocialAccounts() {
  const [accounts, setAccounts] = useState([
    {
      id: "google",
      label: "Google",
      email: "chienbinhthephai@gmail.com",
      connected: true,
      icon: <GoogleIcon />,
      color: "bg-[#F3F8FF]",
      border: "border-[#4285F4]/20",
    },
    {
      id: "facebook",
      label: "Facebook",
      email: null,
      connected: false,
      icon: <FacebookIcon />,
      color: "bg-[#F0F4FF]",
      border: "border-[#1877F2]/20",
    },
  ]);

  const toggle = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              connected: !a.connected,
              email: !a.connected ? `user@${id}.com` : null,
            }
          : a,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((a) => (
        <div
          key={a.id}
          className={`flex items-center justify-between rounded-xl border px-4 py-3.5 transition-colors ${
            a.connected ? `${a.color} ${a.border}` : "border-[#E7EEEC] bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-[#E7EEEC] bg-white shadow-sm">
              {a.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#16302b]">{a.label}</p>
              {a.connected && a.email ? (
                <p className="mt-0.5 text-xs text-[#9AAEA9]">{a.email}</p>
              ) : (
                <p className="mt-0.5 text-xs text-[#9AAEA9]">Chưa liên kết</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {a.connected && (
              <span className="flex items-center gap-1 rounded-full bg-[#E4F6EF] px-2.5 py-0.5 text-[11px] font-semibold text-[#0E9F8E]">
                <Check className="size-3" />
                Đã liên kết
              </span>
            )}
            <button
              type="button"
              onClick={() => toggle(a.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                a.connected
                  ? "border border-[#E7EEEC] bg-white text-[#ef4444] hover:bg-[#ef4444]/5"
                  : "bg-[#0E9F8E] text-white hover:bg-[#0b7a6d]"
              }`}
            >
              {a.connected ? "Huỷ liên kết" : "Liên kết"}
            </button>
          </div>
        </div>
      ))}

      <p className="text-xs text-[#9AAEA9]">
        Liên kết tài khoản mạng xã hội để đăng nhập nhanh mà không cần mật khẩu.
      </p>
    </div>
  );
}

/* ─── Tab panels ─── */
function getInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const f = firstName?.charAt(0) ?? "";
  const l = lastName?.charAt(0) ?? "";
  return (f + l).toUpperCase() || "U";
}

type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string;
  description: string;
  address: string;
  district: string;
  province: string;
};

/* TUTOR-only profile layout — card sections, square avatar, tag-chip subjects.
   Receives all state/handlers from ProfilePanel; owns no data-fetching itself. */
function TutorProfilePanel({
  avatarSrc,
  initials,
  avatarUploading,
  avatarRemoving,
  fileInputRef,
  handleAvatarSelect,
  handleAvatarRemove,
  form,
  updateField,
  profileSaving,
  profileSaved,
  handleProfileSave,
}: {
  avatarSrc: string | null;
  initials: string;
  avatarUploading: boolean;
  avatarRemoving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarRemove: () => void;
  form: ProfileFormState;
  updateField: (key: keyof ProfileFormState, value: string) => void;
  profileSaving: boolean;
  profileSaved: boolean;
  handleProfileSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Avatar card */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[#16302b]">
          Ảnh đại diện
        </p>
        <div className="flex items-center gap-4">
          {avatarSrc ? (
            <Image
              width={80}
              height={80}
              src={avatarSrc}
              alt="Avatar"
              className="size-20 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-xl bg-[#0E9F8E] text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-xs text-[#9AAEA9]">
              PNG hoặc JPG, tối thiểu 400×400px. Tối đa 2MB.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="flex items-center gap-1.5 rounded-lg bg-[#0E9F8E] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0b7a6d] disabled:opacity-60"
              >
                {avatarUploading && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {avatarUploading ? "Đang tải..." : "Tải ảnh lên"}
              </button>
              <button
                type="button"
                onClick={handleAvatarRemove}
                disabled={avatarRemoving || !avatarSrc}
                className="flex items-center gap-1.5 rounded-lg border border-[#E7EEEC] px-3 py-1.5 text-xs font-semibold text-[#5c726d] transition-colors hover:bg-[#F3F7F5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {avatarRemoving && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {avatarRemoving ? "Đang xoá..." : "Xoá ảnh"}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>
        </div>
      </div>

      {/* Personal info card */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[#16302b]">
          Thông tin cá nhân
        </p>
        <div className="grid grid-cols-2 gap-4">
          <LabelField label="Họ">
            <TextInput
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </LabelField>
          <LabelField label="Tên">
            <TextInput
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </LabelField>
          <LabelField label="Email">
            <TextInput
              value={form.email}
              type="email"
              onChange={(e) => updateField("email", e.target.value)}
            />
          </LabelField>
          <LabelField label="Số điện thoại">
            <TextInput
              value={form.phone}
              type="tel"
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </LabelField>
          <div className="col-span-2">
            <LabelField label="Môn giảng dạy">
              <SubjectsChipInput
                value={form.subjects}
                onChange={(next) => updateField("subjects", next)}
              />
            </LabelField>
          </div>
          <div className="col-span-2">
            <LabelField label="Giới thiệu bản thân">
              <Textarea
                value={form.description}
                rows={3}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </LabelField>
          </div>
        </div>
      </div>

      {/* Address card */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[#16302b]">Địa chỉ</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <LabelField label="Địa chỉ">
              <TextInput
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </LabelField>
          </div>
          <LabelField label="Quận / Huyện">
            <TextInput
              value={form.district}
              onChange={(e) => updateField("district", e.target.value)}
            />
          </LabelField>
          <LabelField label="Tỉnh / Thành phố">
            <TextInput
              value={form.province}
              onChange={(e) => updateField("province", e.target.value)}
            />
          </LabelField>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleProfileSave}
          disabled={profileSaving}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${
            profileSaved ? "bg-[#0b7a6d]" : "bg-[#0E9F8E] hover:bg-[#0b7a6d]"
          } disabled:opacity-60`}
        >
          {profileSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : profileSaved ? (
            <Check className="size-4" />
          ) : null}
          {profileSaving
            ? "Đang lưu..."
            : profileSaved
              ? "Đã lưu!"
              : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

function ProfilePanel() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const role = useCurrentUserRole();
  // Backend (`user.service.ts::updateOwnProfileService`) rejects the whole request if a STUDENT
  // sends firstName/lastName at all, even unchanged — so these fields must both be locked in the
  // UI and stripped from the payload, not just disabled.
  const isNameLocked = role === "STUDENT";

  // PARENT profile would list linked students, but gateway `GET /students` is
  // ADMIN-only and there is no PARENT "my children" endpoint yet, so the list
  // is not fetched for PARENT (see the empty-state message below).
  const isParent = role === "PARENT";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileFormState>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    subjects: user?.subjects ?? "",
    description: user?.description ?? "",
    address: user?.address ?? "",
    district: user?.district ?? "",
    province: user?.province ?? "",
  });

  // Re-initialize the form when a different user loads, without an effect.
  // Adjusting state during render (the "previous value" pattern) avoids the
  // cascading render that setState-in-effect causes, and only resets on a real
  // user change so in-progress edits aren't clobbered on every store update.
  const [syncedUserId, setSyncedUserId] = useState(user?.id);
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      subjects: user.subjects ?? "",
      description: user.description ?? "",
      address: user.address ?? "",
      district: user.district ?? "",
      province: user.province ?? "",
    });
  }

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh tối đa 2MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setAvatarUploading(true);
    try {
      const uploaded = await apiUploadFile(file);
      const raw = await axiosInstance.put("/users", { avatar: uploaded.url });
      const updatedUser = unwrapApiData<Partial<ApiUser>>(raw.data);
      if (user) {
        setUser({ ...user, avatar: uploaded.url, ...updatedUser });
      }
      setAvatarPreview(null);
    } catch {
      alert("Tải ảnh thất bại");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(previewUrl);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // "Xoá ảnh" reuses PUT /users (there is no separate delete-avatar endpoint)
  // — sending `avatar: null` clears it server-side per `updateUserSchema`.
  const handleAvatarRemove = async () => {
    setAvatarRemoving(true);
    try {
      const raw = await axiosInstance.put("/users", { avatar: null });
      const updatedUser = unwrapApiData<Partial<ApiUser>>(raw.data);
      if (user) {
        setUser({ ...user, avatar: null, ...updatedUser });
      }
      setAvatarPreview(null);
    } catch {
      alert("Xoá ảnh thất bại");
    } finally {
      setAvatarRemoving(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const { firstName, lastName, ...rest } = form;
      const payload: UpdateUserPayload = isNameLocked
        ? rest
        : { firstName, lastName, ...rest };
      const raw = await axiosInstance.put("/users", payload);
      const updatedUser = unwrapApiData<Partial<ApiUser>>(raw.data);
      // Merge instead of replace: the update endpoint may return a partial
      // user (without id/avatar/role), and replacing would wipe those fields
      // from the store — blanking the UI until a full refetch on reload.
      // Overlay the submitted form values, then any authoritative fields the
      // server echoes back.
      if (user) {
        setUser({ ...user, ...form, ...updatedUser });
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      alert("Cập nhật thất bại");
    } finally {
      setProfileSaving(false);
    }
  };

  const avatarSrc = avatarPreview ?? user?.avatar ?? null;
  const initials = getInitials(user?.firstName, user?.lastName);

  if (role === "TUTOR") {
    return (
      <TutorProfilePanel
        avatarSrc={avatarSrc}
        initials={initials}
        avatarUploading={avatarUploading}
        avatarRemoving={avatarRemoving}
        fileInputRef={fileInputRef}
        handleAvatarSelect={handleAvatarSelect}
        handleAvatarRemove={handleAvatarRemove}
        form={form}
        updateField={updateField}
        profileSaving={profileSaving}
        profileSaved={profileSaved}
        handleProfileSave={handleProfileSave}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {avatarSrc ? (
            <Image
              width={80}
              height={80}
              src={avatarSrc}
              alt="Avatar"
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-[#0E9F8E] text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#0E9F8E] text-white shadow-sm hover:bg-[#0b7a6d] transition-colors disabled:opacity-60"
          >
            {avatarUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#16302b]">Ảnh đại diện</p>
          <p className="mt-0.5 text-xs text-[#9AAEA9]">JPG, PNG tối đa 2MB</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="mt-2 rounded-lg border border-[#E7EEEC] px-3 py-1.5 text-xs font-medium text-[#16302b] hover:bg-[#F3F7F5] transition-colors disabled:opacity-50"
          >
            {avatarUploading ? "Đang tải..." : "Tải ảnh lên"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarSelect}
          />
        </div>
      </div>

      <Divider />
      <SectionTitle>Thông tin cơ bản</SectionTitle>

      <div className="rounded-lg border border-[#EEF3F1] px-4">
        <FormRow label="Họ">
          <TextInput
            value={form.firstName}
            onChange={
              isNameLocked
                ? undefined
                : (e) => updateField("firstName", e.target.value)
            }
          />
          {isNameLocked && (
            <p className="mt-1.5 text-xs text-[#9AAEA9]">
              Học sinh không thể tự đổi họ tên — liên hệ gia sư hoặc quản trị
              viên nếu cần chỉnh sửa.
            </p>
          )}
        </FormRow>
        <FormRow label="Tên">
          <TextInput
            value={form.lastName}
            onChange={
              isNameLocked
                ? undefined
                : (e) => updateField("lastName", e.target.value)
            }
          />
        </FormRow>
        <FormRow label="Email">
          <TextInput
            value={form.email}
            type="email"
            onChange={(e) => updateField("email", e.target.value)}
          />
        </FormRow>
        <FormRow label="Số điện thoại">
          <TextInput
            value={form.phone}
            type="tel"
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </FormRow>
        <FormRow label={role === "STUDENT" ? "Môn đang học" : "Môn dạy"}>
          <TextInput
            value={form.subjects}
            placeholder="Ví dụ: Toán, Vật lý..."
            onChange={(e) => updateField("subjects", e.target.value)}
          />
        </FormRow>
        <FormRow label="Giới thiệu">
          <Textarea
            value={form.description}
            rows={2}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </FormRow>
      </div>

      {isParent && (
        <>
          <Divider />
          <SectionTitle>Học sinh liên kết</SectionTitle>

          <p className="text-sm text-[#9AAEA9]">
            Chức năng xem học sinh liên kết hiện chưa khả dụng.
          </p>
        </>
      )}

      <Divider />
      <SectionTitle>Địa chỉ</SectionTitle>

      <div className="rounded-lg border border-[#EEF3F1] px-4">
        <FormRow label="Địa chỉ">
          <TextInput
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </FormRow>
        <FormRow label="Quận / Huyện">
          <TextInput
            value={form.district}
            onChange={(e) => updateField("district", e.target.value)}
          />
        </FormRow>
        <FormRow label="Tỉnh / Thành phố">
          <TextInput
            value={form.province}
            onChange={(e) => updateField("province", e.target.value)}
          />
        </FormRow>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleProfileSave}
          disabled={profileSaving}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${
            profileSaved ? "bg-[#0b7a6d]" : "bg-[#0E9F8E] hover:bg-[#0b7a6d]"
          } disabled:opacity-60`}
        >
          {profileSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : profileSaved ? (
            <Check className="size-4" />
          ) : null}
          {profileSaving
            ? "Đang lưu..."
            : profileSaved
              ? "Đã lưu!"
              : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

/* ─── Change-password schema ─── */
// Mirrors gateway `changePasswordSchema`: the current password only needs to be non-empty
// (old passwords may predate the rules); the new one must match the full policy.
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Tối thiểu 8 ký tự")
      .max(20, "Tối đa 20 ký tự")
      .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
      .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const CHANGE_PASSWORD_DEFAULTS: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function PasswordInput({
  label,
  show,
  onToggle,
  registration,
  error,
}: {
  label: string;
  show: boolean;
  onToggle: () => void;
  registration?: ReturnType<UseFormRegister<ChangePasswordValues>>;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#16302b]">
        {label}
      </label>
      <div className="relative">
        <input
          {...registration}
          type={show ? "text" : "password"}
          className={`h-10 w-full rounded-lg border bg-white px-3 pr-10 text-sm text-[#16302b] focus:outline-none focus:ring-2 transition-colors ${
            error
              ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
              : "border-[#E7EEEC] focus:border-[#0E9F8E] focus:ring-[#0E9F8E]/20"
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AAEA9] hover:text-[#16302b] transition-colors"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}

function SecurityPanel() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: CHANGE_PASSWORD_DEFAULTS,
  });

  const { mutate, isPending } = useUserActions().changePassword;

  const onSubmit = (values: ChangePasswordValues) =>
    mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật mật khẩu thành công");
          reset();
        },
        onError: (err) => {
          const msg = getErrorMessage(err);
          const isCurrentPasswordError =
            msg.toLowerCase().includes("current") ||
            msg.toLowerCase().includes("hiện tại") ||
            msg.toLowerCase().includes("sai") ||
            msg.toLowerCase().includes("incorrect");
          if (isCurrentPasswordError) {
            setError("currentPassword", { message: msg });
          } else {
            toast.error(msg);
          }
        },
      },
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <SectionTitle>Đổi mật khẩu</SectionTitle>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <PasswordInput
              label="Mật khẩu hiện tại"
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              registration={register("currentPassword")}
              error={errors.currentPassword?.message}
            />
            <PasswordInput
              label="Mật khẩu mới"
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              registration={register("newPassword")}
              error={errors.newPassword?.message}
            />
            <PasswordInput
              label="Xác nhận mật khẩu mới"
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              registration={register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            <p className="text-xs text-[#9AAEA9]">
              Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-[#0E9F8E] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#0b7a6d] disabled:opacity-60"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </div>
          </form>
        </div>

        <div className="hidden self-stretch border-l border-[#EEF3F1] lg:block" />

        <div className="min-w-0 flex-1">
          <SectionTitle>Liên kết tài khoản mạng xã hội</SectionTitle>
          <SocialAccounts />
        </div>
      </div>

      <Divider />
      <SectionTitle>Phiên đăng nhập</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            device: "Chrome · Windows 11",
            location: "TP. Hồ Chí Minh",
            time: "Đang hoạt động",
            current: true,
          },
          {
            device: "Safari · iPhone 14",
            location: "TP. Hồ Chí Minh",
            time: "2 giờ trước",
            current: false,
          },
          {
            device: "Firefox · MacOS",
            location: "Hà Nội",
            time: "Hôm qua",
            current: false,
          },
        ].map((s) => (
          <div
            key={s.device}
            className="flex items-center justify-between rounded-lg border border-[#EEF3F1] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-[#16302b]">
                {s.device}
                {s.current && (
                  <span className="ml-2 rounded-full bg-[#E4F6EF] px-2 py-0.5 text-[11px] font-semibold text-[#0E9F8E]">
                    Hiện tại
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-[#9AAEA9]">
                {s.location} · {s.time}
              </p>
            </div>
            {!s.current && (
              <button
                type="button"
                className="text-xs font-medium text-[#ef4444] hover:underline"
              >
                Đăng xuất
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-[#ef4444]/30 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/5 transition-colors"
      >
        Đăng xuất khỏi tất cả thiết bị
      </button>
    </div>
  );
}

function NotificationsPanel() {
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>Kênh thông báo</SectionTitle>
      <div className="rounded-lg border border-[#EEF3F1] divide-y divide-[#EEF3F1] px-4">
        <Toggle
          defaultChecked
          label="Thông báo trong ứng dụng"
          desc="Hiển thị thông báo trực tiếp trên màn hình"
        />
        <Toggle
          defaultChecked
          label="Email"
          desc="Gửi tóm tắt thông báo về email"
        />
        <Toggle label="SMS" desc="Nhắn tin đến số điện thoại đã đăng ký" />
      </div>

      <Divider />
      <SectionTitle>Loại thông báo</SectionTitle>
      <div className="rounded-lg border border-[#EEF3F1] divide-y divide-[#EEF3F1] px-4">
        <Toggle
          defaultChecked
          label="Học phí"
          desc="Thanh toán mới, nhắc nhở đến hạn"
        />
        <Toggle
          defaultChecked
          label="Học sinh"
          desc="Nghỉ học, kết quả kiểm tra"
        />
        <Toggle
          defaultChecked
          label="Lịch học"
          desc="Thay đổi lịch, buổi học sắp tới"
        />
        <Toggle label="Gia sư" desc="Cập nhật chương trình, nhắc nhở nội bộ" />
        <Toggle
          defaultChecked
          label="Hệ thống"
          desc="Bảo trì, cập nhật tính năng"
        />
      </div>

      <Divider />
      <SectionTitle>Lịch nhận thông báo</SectionTitle>
      <div className="rounded-lg border border-[#EEF3F1] divide-y divide-[#EEF3F1] px-4">
        <Toggle
          defaultChecked
          label="Nhắc lịch trước 30 phút"
          desc="Thông báo trước mỗi buổi dạy"
        />
        <Toggle label="Tóm tắt cuối ngày" desc="Gửi lúc 21:00 mỗi ngày" />
        <Toggle
          defaultChecked
          label="Tóm tắt cuối tuần"
          desc="Gửi sáng Chủ nhật hàng tuần"
        />
      </div>

      <SaveButton />
    </div>
  );
}

const ACCENT_COLORS = [
  { id: "teal", hex: "#0E9F8E", colorTheme: "supabase" as ColorThemeSelection },
  { id: "blue", hex: "#3B82F6", colorTheme: "modern-minimal" as ColorThemeSelection },
  { id: "purple", hex: "#8B5CF6", colorTheme: "violet-bloom" as ColorThemeSelection },
  { id: "pink", hex: "#EC4899", colorTheme: "t3-chat" as ColorThemeSelection },
  { id: "orange", hex: "#F97316", colorTheme: "tangerine" as ColorThemeSelection },
] as const;

type AccentId = (typeof ACCENT_COLORS)[number]["id"];

const COLOR_THEME_TO_ACCENT: Record<string, AccentId> = {
  supabase: "teal",
  "modern-minimal": "blue",
  "violet-bloom": "purple",
  "t3-chat": "pink",
  tangerine: "orange",
};

function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const { language, setLocale } = useLocale();

  const resolvedTheme = theme === "system" ? "light" : theme;
  const currentAccentId =
    COLOR_THEME_TO_ACCENT[colorTheme] ?? "teal";
  const currentLang = language ?? "vi";

  return (
    <div className="flex flex-col gap-6">
      {/* Chủ đề hiển thị */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[#16302b]">
          Chủ đề hiển thị
        </p>
        <div className="grid grid-cols-2 gap-4">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                resolvedTheme === t
                  ? "border-[#0E9F8E]"
                  : "border-[#E7EEEC] hover:border-[#0E9F8E]/40"
              }`}
            >
              {/* Mini preview */}
              <div
                className={`flex flex-col gap-2 rounded-lg border p-3 ${
                  t === "dark"
                    ? "border-[#0b241f] bg-[#0b241f]"
                    : "border-[#E7EEEC] bg-[#F3F7F5]"
                }`}
              >
                <div
                  className={`h-2 w-2/3 rounded-full ${
                    t === "dark" ? "bg-white/25" : "bg-[#D8E3E0]"
                  }`}
                />
                <div
                  className={`h-9 rounded-lg ${
                    t === "dark" ? "bg-[#123830]" : "bg-white"
                  }`}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`flex size-4 items-center justify-center rounded-full border-2 ${
                    resolvedTheme === t
                      ? "border-[#0E9F8E] bg-[#0E9F8E]"
                      : "border-[#E7EEEC]"
                  }`}
                >
                  {resolvedTheme === t && (
                    <span className="size-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="text-sm font-medium text-[#16302b]">
                  {t === "light" ? "Sáng" : "Tối"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Màu nhấn */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#16302b]">Màu nhấn</p>
        <p className="mt-0.5 text-xs text-[#9AAEA9]">
          Màu chủ đạo cho nút và trạng thái hoạt động.
        </p>
        <div className="mt-4 flex items-center gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorTheme(c.colorTheme)}
              aria-label={c.id}
              style={{ backgroundColor: c.hex }}
              className={`flex size-9 items-center justify-center rounded-full transition-all ${
                currentAccentId === c.id
                  ? "ring-2 ring-offset-2 ring-[#16302b]/20"
                  : ""
              }`}
            >
              {currentAccentId === c.id && (
                <Check className="size-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ngôn ngữ */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[#16302b]">Ngôn ngữ</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { code: "vi", label: "Tiếng Việt", sub: "Mặc định", flag: "🇻🇳" },
            { code: "en", label: "English", sub: "English (US)", flag: "🇬🇧" },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code as "vi" | "en")}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                currentLang === l.code
                  ? "border-[#0E9F8E]"
                  : "border-[#E7EEEC] bg-white hover:border-[#0E9F8E]/40"
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-[#16302b]">
                  {l.label}
                </p>
                <p className="text-xs text-[#9AAEA9]">{l.sub}</p>
              </div>
              {currentLang === l.code && (
                <Check className="ml-auto size-4 text-[#0E9F8E]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClassesPanel() {
  return (
    <div className="grid grid-cols-2 gap-6 w-full">
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[#16302b]">
          Mặc định buổi học
        </p>
        <div className="grid grid-4 gap-4">
          <LabelField label="Thời lượng buổi học">
            <select
              defaultValue="90 phút"
              className="h-10 w-full rounded-lg border border-[#E7EEEC] bg-white px-3 text-sm text-[#16302b] focus:border-[#0E9F8E] focus:outline-none"
            >
              <option>60 phút</option>
              <option>90 phút</option>
              <option>120 phút</option>
            </select>
          </LabelField>
          <LabelField label="Học phí mặc định / buổi">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                defaultValue="250.000"
                className="h-10 w-full rounded-lg border border-[#E7EEEC] bg-white px-3 pr-8 text-sm text-[#16302b] focus:border-[#0E9F8E] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9AAEA9]">
                đ
              </span>
            </div>
          </LabelField>
          <LabelField label="Múi giờ">
            <select className="h-10 w-full rounded-lg border border-[#E7EEEC] bg-white px-3 text-sm text-[#16302b] focus:border-[#0E9F8E] focus:outline-none">
              <option>(GMT+7) Hà Nội</option>
              <option>(GMT+7) TP. Hồ Chí Minh</option>
              <option>(GMT+7) Đà Nẵng</option>
            </select>
          </LabelField>
          <LabelField label="Giờ làm việc">
            <input
              type="text"
              defaultValue="08:00 – 21:00"
              className="h-10 w-full rounded-lg border border-[#E7EEEC] bg-white px-3 text-sm text-[#16302b] focus:border-[#0E9F8E] focus:outline-none"
            />
          </LabelField>
        </div>
      </div>

      <div className="rounded-lg border border-[#EEF3F1] divide-y divide-[#EEF3F1] px-4 shadow-sm">
        <Toggle
          defaultChecked
          label="Tự động nhắc học sinh"
          desc="Gửi SMS nhắc học sinh trước buổi học 1 giờ."
        />
        <Toggle
          defaultChecked
          label="Cho phép đặt lịch online"
          desc="Học sinh có thể tự đăng ký vào khung giờ trống."
        />
        <Toggle
          label="Tự động tạo hoá đơn cuối tháng"
          desc="Tổng hợp học phí theo số buổi đã dạy."
        />
        <Toggle
          label="Thời gian nghỉ giữa buổi"
          desc="Tự chừa 15 phút giữa hai buổi liên tiếp."
        />
        <SaveButton />
      </div>
    </div>
  );
}

type BankInfoState = {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch: string;
};

function FeesPanel() {
  const [bank, setBank] = useState<BankInfoState>({
    bankName: "Vietcombank",
    accountHolder: "NGUYEN MINH QUAN",
    accountNumber: "0123 4567 8904 821",
    branch: "CN Hà Đông",
  });

  const updateBank = (key: keyof BankInfoState, value: string) => {
    setBank((prev) => ({ ...prev, [key]: value }));
  };

  const maskedAccountNumber = bank.accountNumber
    .replace(/\s/g, "")
    .replace(/^\d+(\d{4})$/, "•••• •••• $1");

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(bank.accountNumber.replace(/\s/g, ""));
      toast.success("Đã sao chép số tài khoản");
    } catch {
      toast.error("Sao chép thất bại");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Bank account card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E9F8E] to-[#0B4A42] p-6 text-white shadow-sm">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Tài khoản nhận tiền
            </p>
            <p className="mt-1 text-lg font-semibold">{bank.bankName}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Mặc định
          </span>
        </div>
        <p className="relative mt-6 text-2xl font-semibold tracking-[0.2em]">
          {maskedAccountNumber}
        </p>
        <div className="relative mt-4 flex items-end justify-between">
          <p className="text-sm font-medium text-white/90">
            {bank.accountHolder}
          </p>
          <p className="text-xs text-white/70">{bank.branch}</p>
        </div>
      </div>

      {/* Bank info card */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[#16302b]">
          Thông tin ngân hàng
        </p>
        <div className="grid grid-cols-2 gap-4">
          <LabelField label="Ngân hàng">
            <TextInput
              value={bank.bankName}
              onChange={(e) => updateBank("bankName", e.target.value)}
            />
          </LabelField>
          <LabelField label="Chủ tài khoản">
            <TextInput
              value={bank.accountHolder}
              onChange={(e) => updateBank("accountHolder", e.target.value)}
            />
          </LabelField>
          <LabelField label="Số tài khoản">
            <TextInput
              value={bank.accountNumber}
              onChange={(e) => updateBank("accountNumber", e.target.value)}
            />
          </LabelField>
          <LabelField label="Chi nhánh">
            <TextInput
              value={bank.branch}
              onChange={(e) => updateBank("branch", e.target.value)}
            />
          </LabelField>
        </div>
      </div>

      {/* QR card */}
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-semibold text-[#16302b]">
            Mã QR nhận học phí
          </p>
          <span className="rounded-full bg-[#E4F6EF] px-2 py-0.5 text-[11px] font-semibold text-[#0E9F8E]">
            Tự động tạo
          </span>
        </div>
        <p className="mb-4 text-xs text-[#9AAEA9]">
          Mã được tạo từ thông tin ngân hàng ở trên. Phụ huynh quét để chuyển
          học phí trực tiếp vào tài khoản của bạn.
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="w-full max-w-[180px] shrink-0 rounded-xl border border-[#EEF3F1] p-3 text-center">
            <p className="mb-2 flex items-center justify-center gap-1 text-xs font-semibold text-[#16302b]">
              <QrCode className="size-3.5 text-[#0E9F8E]" />
              VietQR
            </p>
            <div className="flex aspect-square items-center justify-center rounded-lg bg-[#F3F7F5]">
              <QrCode className="size-16 text-[#16302b]" strokeWidth={1} />
            </div>
            <p className="mt-2 truncate text-xs font-medium text-[#16302b]">
              {bank.accountHolder}
            </p>
            <p className="text-[11px] text-[#9AAEA9]">
              {bank.bankName} · {maskedAccountNumber.slice(-4)}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col divide-y divide-[#EEF3F1]">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-[#9AAEA9]">Ngân hàng</span>
                <span className="font-medium text-[#16302b]">
                  {bank.bankName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-[#9AAEA9]">Số tài khoản</span>
                <span className="font-medium text-[#16302b]">
                  {bank.accountNumber}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-[#9AAEA9]">Chủ tài khoản</span>
                <span className="font-medium text-[#16302b]">
                  {bank.accountHolder}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-[#0E9F8E] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0b7a6d]"
              >
                <Download className="size-3.5" />
                Tải mã QR
              </button>
              <button
                type="button"
                onClick={handleCopyAccountNumber}
                className="flex items-center gap-1.5 rounded-lg border border-[#E7EEEC] px-3 py-1.5 text-xs font-semibold text-[#16302b] transition-colors hover:bg-[#F3F7F5]"
              >
                <Copy className="size-3.5" />
                Sao chép số TK
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <Toggle
          defaultChecked
          label="Gửi nhắc thanh toán tự động"
          desc="Nhắn phụ huynh khi học phí đến hạn."
        />
      </div>
      <div className="rounded-lg border border-[#EEF3F1] p-4 shadow-sm">
        <Toggle
          label="Gửi biên lai điện tử"
          desc="Tự động gửi biên lai sau mỗi lần nhận tiền."
        />
      </div>

      <SaveButton />
    </div>
  );
}

const PANELS: Record<Tab, React.ReactNode> = {
  profile: <ProfilePanel />,
  security: <SecurityPanel />,
  notifications: <NotificationsPanel />,
  appearance: <AppearancePanel />,
  classes: <ClassesPanel />,
  fees: <FeesPanel />,
};

/* ─── Page ─── */
export default function SettingsPage() {
  const setUser = useAuthStore((s) => s.setUser);
  const role = useCurrentUserRole();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const visibleTabs = useMemo(
    () =>
      TABS.filter((tab) => {
        const allow = TAB_ACCESS[tab.id];
        return allow === null || allow.includes(role);
      }),
    [role],
  );

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        const raw = await apiGet<unknown>("/users/detail-user");
        const user = unwrapApiData<ApiUser>(raw);
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        /* silent */
      }
    };
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // Tab đang chọn có thể bị ẩn theo role (đổi role, hoặc role vừa mới resolve
  // xong) — suy ra tab hiển thị thực tế ngay trong render thay vì setState
  // trong effect (tránh cascading render), rơi về tab đầu tiên còn hiển thị.
  const effectiveTab: Tab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? "profile");

  return (
    <div className="flex gap-6 min-h-full">
      {/* Sidebar nav */}
      <aside className="w-56 shrink-0">
        <nav className="flex flex-col gap-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = effectiveTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-[#0E9F8E] text-white"
                    : "text-[#5c726d] hover:bg-[#F1FBF9] hover:text-[#16302b]"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${active ? "text-white" : ""}`}
                  >
                    {tab.label}
                  </p>
                  <p
                    className={`text-[11px] truncate ${active ? "text-white/70" : "text-[#9AAEA9]"}`}
                  >
                    {tab.desc}
                  </p>
                </div>
                {!active && (
                  <ChevronRight className="ml-auto size-3.5 shrink-0 text-[#9AAEA9]" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-[#E7EEEC] bg-white p-6 shadow-sm">
          {/* Panel header */}
          <div className="mb-6 border-b border-[#EEF3F1] pb-5">
            {(() => {
              const tab =
                visibleTabs.find((t) => t.id === effectiveTab) ??
                visibleTabs[0];
              if (!tab) return null;
              const Icon = tab.icon;
              // TUTOR sees a role-specific subtitle on the profile tab (this
              // info is visible to their students/parents) — every other
              // tab/role keeps the generic desc from TABS.
              const desc =
                tab.id === "profile" && role === "TUTOR"
                  ? "Thông tin này hiển thị với phụ huynh và học sinh của bạn."
                  : tab.desc;
              return (
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#E4F6EF]">
                    <Icon
                      className="size-4.5 text-[#0E9F8E]"
                      strokeWidth={1.8}
                    />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-[#16302b]">
                      {tab.label}
                    </h2>
                    <p className="text-xs text-[#9AAEA9]">{desc}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Panel body */}
          {PANELS[effectiveTab]}
        </div>
      </div>
    </div>
  );
}
