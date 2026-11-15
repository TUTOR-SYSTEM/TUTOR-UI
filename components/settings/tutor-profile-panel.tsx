"use client";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import type { ProfileFormState } from "@/components/settings/profile-panel";
import type * as React from "react";
import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { FormField } from "@/components/ui/form-field.ui";
import { Textarea } from "@/components/ui/textarea.ui";
import { SubjectsInput } from "@/components/settings/subjects-input";

/* TUTOR-only profile layout — card sections, square avatar, tag-chip subjects.
   Receives all state/handlers from ProfilePanel; owns no data-fetching itself. */
export function TutorProfilePanel({
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
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-foreground">
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
            <div className="flex size-20 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">
              PNG hoặc JPG, tối thiểu 400×400px. Tối đa 2MB.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button variant="ghost"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {avatarUploading && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {avatarUploading ? "Đang tải..." : "Tải ảnh lên"}
              </Button>
              <Button variant="ghost"
                type="button"
                onClick={handleAvatarRemove}
                disabled={avatarRemoving || !avatarSrc}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {avatarRemoving && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {avatarRemoving ? "Đang xoá..." : "Xoá ảnh"}
              </Button>
            </div>
            <Input
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
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">
          Thông tin cá nhân
        </p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Họ">
            <Input
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </FormField>
          <FormField label="Tên">
            <Input
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </FormField>
          <FormField label="Email">
            <Input
              value={form.email}
              type="email"
              onChange={(e) => updateField("email", e.target.value)}
            />
          </FormField>
          <FormField label="Số điện thoại">
            <Input
              value={form.phone}
              type="tel"
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </FormField>
          <div className="col-span-2">
            <FormField label="Môn giảng dạy">
              <SubjectsInput
                value={form.subjects}
                onChange={(next) => updateField("subjects", next)}
              />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Giới thiệu bản thân">
              <Textarea
                value={form.description}
                rows={3}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Address card */}
      <div className="rounded-lg border border-border-light p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-foreground">Địa chỉ</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Địa chỉ">
              <Input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Quận / Huyện">
            <Input
              value={form.district}
              onChange={(e) => updateField("district", e.target.value)}
            />
          </FormField>
          <FormField label="Tỉnh / Thành phố">
            <Input
              value={form.province}
              onChange={(e) => updateField("province", e.target.value)}
            />
          </FormField>
        </div>
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
            ? "Đang lưu..."
            : profileSaved
              ? "Đã lưu!"
              : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
