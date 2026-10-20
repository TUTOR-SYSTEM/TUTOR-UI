"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
import { SUBJECT_OPTIONS } from "@/lib/subjects";
import { useUpdateTutorById } from "@/hooks/useAdminUsers.hook";
import type { ApiManagedUser, UpdateAdminUserPayload } from "@/types";

const tutorFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(100, "Tên tối đa 100 ký tự"),
  lastName: z
    .string()
    .trim()
    .min(2, "Họ phải có ít nhất 2 ký tự")
    .max(100, "Họ tối đa 100 ký tự"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().trim().max(20, "SĐT tối đa 20 ký tự"),
  school: z.string().trim().max(255, "Trường tối đa 255 ký tự"),
  subjects: z.array(z.string()),
});

type TutorFormValues = z.infer<typeof tutorFormSchema>;

function toFormValues(tutor: ApiManagedUser): TutorFormValues {
  return {
    firstName: tutor.firstName ?? "",
    lastName: tutor.lastName ?? "",
    email: tutor.email ?? "",
    phone: tutor.phone ?? "",
    school: tutor.school ?? "",
    subjects: tutor.subjects ?? [],
  };
}

/** Only the fields that actually changed — the BE validates by key presence. */
function buildPatch(
  tutor: ApiManagedUser,
  values: TutorFormValues,
): UpdateAdminUserPayload {
  const original = toFormValues(tutor);
  const patch: UpdateAdminUserPayload = {};
  if (values.firstName !== original.firstName)
    patch.firstName = values.firstName;
  if (values.lastName !== original.lastName) patch.lastName = values.lastName;
  if (values.email !== original.email) patch.email = values.email;
  if (values.phone !== original.phone) patch.phone = values.phone || null;
  if (values.school !== original.school) patch.school = values.school || null;
  if (values.subjects.join("|") !== original.subjects.join("|"))
    patch.subjects = values.subjects;
  return patch;
}

type Props = {
  tutor: ApiManagedUser | null;
  onClose: () => void;
  /** Called after a successful save — parent should refetch the list. */
  onSaved?: () => void;
};

export function EditTutorDialog({ tutor, onClose, onSaved }: Props) {
  if (!tutor) return null;
  return (
    <EditTutorForm
      key={tutor.id}
      tutor={tutor}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function EditTutorForm({
  tutor,
  onClose,
  onSaved,
}: {
  tutor: ApiManagedUser;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TutorFormValues>({
    resolver: zodResolver(tutorFormSchema),
    defaultValues: toFormValues(tutor),
  });

  const updateTutor = useUpdateTutorById();

  const onSubmit = (values: TutorFormValues) => {
    const patch = buildPatch(tutor, values);
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    updateTutor.mutate(
      { id: tutor.id, ...patch },
      {
        onSuccess: () => {
          toast.success("Cập nhật gia sư thành công!");
          onSaved?.();
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Cập nhật gia sư thất bại"));
        },
      },
    );
  };

  const isPending = updateTutor.isPending;

  return (
    <Dialog
      isOpen
      icon={Pencil}
      title="Chỉnh sửa gia sư"
      subtitle="Cập nhật thông tin tài khoản gia sư."
      className="max-w-2xl"
      cancelText="Hủy"
      onCancel={onClose}
      submitText="Lưu thay đổi"
      submitIcon={Save}
      onSubmit={handleSubmit(onSubmit)}
      loading={isPending}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tutor-lastName">Họ</Label>
          <Input
            id="tutor-lastName"
            {...register("lastName")}
            invalid={!!errors.lastName}
            disabled={isPending}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tutor-firstName">Tên</Label>
          <Input
            id="tutor-firstName"
            {...register("firstName")}
            invalid={!!errors.firstName}
            disabled={isPending}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tutor-email">Email</Label>
          <Input
            id="tutor-email"
            type="email"
            {...register("email")}
            invalid={!!errors.email}
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tutor-phone">Số điện thoại</Label>
          <Input
            id="tutor-phone"
            type="tel"
            {...register("phone")}
            invalid={!!errors.phone}
            disabled={isPending}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="tutor-school">Trường / Nơi công tác</Label>
          <Input
            id="tutor-school"
            {...register("school")}
            invalid={!!errors.school}
            disabled={isPending}
          />
          {errors.school && (
            <p className="text-xs text-destructive">{errors.school.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Môn dạy</Label>
          <Controller
            name="subjects"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = field.value.includes(subject);
                  return (
                    <Button
                      key={subject}
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={selected}
                      disabled={isPending}
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((s) => s !== subject)
                            : [...field.value, subject],
                        )
                      }
                      className={cn(
                        "h-auto! w-auto! rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary hover:bg-primary/10"
                          : "border-input bg-surface-container-lowest text-foreground hover:border-primary/40",
                      )}
                    >
                      {subject}
                    </Button>
                  );
                })}
              </div>
            )}
          />
        </div>
      </form>
    </Dialog>
  );
}
