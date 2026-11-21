"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { type LucideIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button.ui";

type ButtonVariant =
  "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";

type DialogProps = {
  isOpen: boolean;
  /** Icon ở header. Bỏ trống khi nội dung đã có icon riêng (vd ConfirmDialog). */
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  cancelText: string;
  onCancel: () => void;
  submitText: string;
  submitIcon?: LucideIcon;
  onSubmit: () => void;
  /** Visual style of the submit button (e.g. "destructive" for delete confirmations). */
  submitVariant?: ButtonVariant;
  className?: string;
  /** Disables close affordances (backdrop, X, Escape, Cancel) and shows a spinner on the submit button. */
  loading?: boolean;
};

/**
 * Standard modal popup: overlay backdrop + centered card panel with a fixed
 * header/footer and a scrollable body. Does NOT close on backdrop click or
 * Escape — only via the X button, Cancel, or Submit. Renders through a portal.
 */
export const Dialog = ({
  isOpen,
  icon,
  title,
  subtitle,
  children,
  cancelText,
  onCancel,
  submitText,
  submitIcon,
  onSubmit,
  submitVariant,
  className,
  loading = false,
}: DialogProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative z-10 flex max-h-[calc(100vh-2rem)] w-[640px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl",
          className,
        )}
      >
        <Header
          title={title}
          subtitle={subtitle}
          icon={icon}
          onCancel={onCancel}
          loading={loading}
        />

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {children}
        </div>

        <Footer
          cancelText={cancelText}
          onCancel={onCancel}
          submitText={submitText}
          submitIcon={submitIcon}
          onSubmit={onSubmit}
          submitVariant={submitVariant}
          loading={loading}
        />
      </div>
    </div>,
    document.body,
  );
};

export const Header = ({
  title,
  subtitle,
  icon: Icon,
  onCancel,
  loading = false,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onCancel: () => void;
  loading?: boolean;
}) => (
  <header className="flex h-max shrink-0 items-center gap-3 border-b border-border/70 px-6 py-4">
    {Icon && (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Icon className="size-4" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h2 className="truncate text-base font-semibold text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
    <button
      type="button"
      aria-label="Đóng"
      onClick={onCancel}
      disabled={loading}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  </header>
);

export const Footer = ({
  cancelText,
  onCancel,
  submitText,
  submitIcon: SubmitIcon,
  onSubmit,
  submitVariant,
  loading = false,
}: {
  cancelText: string;
  onCancel: () => void;
  submitText: string;
  submitIcon?: LucideIcon;
  onSubmit: () => void;
  submitVariant?: ButtonVariant;
  loading?: boolean;
}) => (
  <footer className="flex h-[72px] shrink-0 items-center justify-end gap-2 border-t border-border/70 px-6">
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={onCancel}
      disabled={loading}
      className="w-auto! px-5"
    >
      {cancelText}
    </Button>
    <Button
      type="button"
      variant={submitVariant}
      size="lg"
      onClick={onSubmit}
      loading={loading}
      className="w-auto! gap-1.5 px-5"
    >
      {SubmitIcon && <SubmitIcon className="size-4" />}
      {submitText}
    </Button>
  </footer>
);
