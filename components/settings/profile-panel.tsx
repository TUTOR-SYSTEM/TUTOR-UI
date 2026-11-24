"use client";

import { useSettingsCopy } from "@/hooks/useSettingsCopy.hook";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import type * as React from "react";
import { useRef, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useAuthStore } from "@/zustand/auth.store";
import type { ApiUser, UpdateUserPayload } from "@/types";
import Image from "next/image";
import { apiUploadFile } from "@/lib/services/student.service";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Textarea } from "@/components/ui/textarea.ui";
import { FormRow } from "@/components/ui/form-row.ui";
import { SectionHeading } from "@/components/ui/section-heading.ui";
import { Separator } from "@/components/ui/separator.ui";
import { TutorProfilePanel } from "@/components/settings/tutor-profile-panel";

/* ─── Tab panels ─── */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const f = firstName?.charAt(0) ?? "";
  const l = lastName?.charAt(0) ?? "";
  return (f + l).toUpperCase() || "U";
}


export type ProfileFormState = {
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


export function ProfilePanel() {
  const { profile: copy, common } = useSettingsCopy();
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
      alert(copy.avatarTooLarge);
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
      alert(copy.uploadFailed);
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
      alert(copy.removeFailed);
    } finally {
      setAvatarRemoving(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      // STUDENT không được tự đổi họ tên lẫn email (BE trả 400) — không gửi hai trường này.
      // `subjects` (môn dạy) chỉ thuộc hồ sơ TUTOR (tutor-profile-panel) — không gửi từ panel này.
      const { firstName, lastName, email, subjects: _subjects, ...rest } = form;
      void _subjects;
      const payload: UpdateUserPayload = {
        ...rest,
        ...(isNameLocked ? {} : { firstName, lastName, email }),
      };
      const raw = await axiosInstance.put("/users", payload);
      const updatedUser = unwrapApiData<Partial<ApiUser>>(raw.data);
      // Merge instead of replace: the update endpoint may return a partial
      // user (without id/avatar/role), and replacing would wipe those fields
      // from the store — blanking the UI until a full refetch on reload.
      // Overlay the submitted form values, then any authoritative fields the
      // server echoes back.
      if (user) {
        setUser({ ...user, ...form, ...(isNameLocked ? { email: user.email } : {}), ...updatedUser });
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      alert(copy.updateFailed);
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
            <div className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <Button variant="ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {avatarUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </Button>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{copy.avatarTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{copy.avatarHint}</p>
          <Button variant="ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {avatarUploading ? copy.uploading : copy.uploadPhoto}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarSelect}
          />
        </div>
      </div>

      <Separator className="my-6" />
      <SectionHeading>{copy.basicInfoTitle}</SectionHeading>

      <div className="rounded-lg border border-border-light px-4">
        <FormRow label={copy.lastName}>
          <Input
            value={form.lastName}
            readOnly={isNameLocked}
            onChange={
              isNameLocked
                ? undefined
                : (e) => updateField("lastName", e.target.value)
            }
          />
          {isNameLocked && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {copy.studentNameLocked}
            </p>
          )}
        </FormRow>
        <FormRow label={copy.firstName}>
          <Input
            value={form.firstName}
            readOnly={isNameLocked}
            onChange={
              isNameLocked
                ? undefined
                : (e) => updateField("firstName", e.target.value)
            }
          />
        </FormRow>
        <FormRow label={copy.email}>
          <Input
            value={form.email}
            type="email"
            readOnly={isNameLocked}
            disabled={isNameLocked}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </FormRow>
        <FormRow label={copy.phone}>
          <Input
            value={form.phone}
            type="tel"
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </FormRow>
        <FormRow label={copy.bio}>
          <Textarea
            value={form.description}
            rows={2}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </FormRow>
      </div>

      {isParent && (
        <>
          <Separator className="my-6" />
          <SectionHeading>{copy.linkedStudentsTitle}</SectionHeading>

          <p className="text-sm text-muted-foreground">
            {copy.linkedStudentsUnavailable}
          </p>
        </>
      )}

      <Separator className="my-6" />
      <SectionHeading>{copy.addressTitle}</SectionHeading>

      <div className="rounded-lg border border-border-light px-4">
        <FormRow label={copy.address}>
          <Input
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </FormRow>
        <FormRow label={copy.district}>
          <Input
            value={form.district}
            onChange={(e) => updateField("district", e.target.value)}
          />
        </FormRow>
        <FormRow label={copy.province}>
          <Input
            value={form.province}
            onChange={(e) => updateField("province", e.target.value)}
          />
        </FormRow>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="ghost"
          type="button"
          onClick={handleProfileSave}
          disabled={profileSaving}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${
            profileSaved ? "bg-primary-hover" : "bg-primary hover:bg-primary-hover"
          } disabled:opacity-60`}
        >
          {profileSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : profileSaved ? (
            <Check className="size-4" />
          ) : null}
          {profileSaving
            ? common.saving
            : profileSaved
              ? common.saved
              : common.save}
        </Button>
      </div>
    </div>
  );
}
