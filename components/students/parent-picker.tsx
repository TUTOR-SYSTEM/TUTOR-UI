"use client";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { FormField } from "@/components/ui/form-field.ui";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { longestWord, matchParentName, type ParentMatch } from "@/lib/parent-match";
import { useUserActions } from "@/lib/services/user.service";
import { useLocale } from "@/hooks/useLocale.hook";
import { formatPersonName } from "@/lib/format/person-name";
import type { ApiManagedUser, Language, ParentOption } from "@/types";

const SUGGESTION_LIMIT = 5;

export function toParentOption(user: ApiManagedUser, language: Language): ParentOption {
  return {
    id: user.id,
    name: formatPersonName(user.firstName, user.lastName, language) || user.email || "",
    firstName: user.firstName?.trim() ?? "",
    lastName: user.lastName?.trim() ?? "",
    phone: user.phone ?? null,
    email: user.email ?? null,
  };
}

type Suggestion = { parent: ParentOption; match: ParentMatch };

/** Họ / Tên as two inputs; the search term is the combined name. */
type SplitName = {
  lastName: string;
  firstName: string;
  onLastNameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  lastLabel: string;
  firstLabel: string;
  lastPlaceholder: string;
  firstPlaceholder: string;
  /** Marks both Họ and Tên as required (`*`). */
  required?: boolean;
  lastError?: string;
  firstError?: string;
};

type ParentPickerProps = {
  label: string;
  placeholder: string;
  required?: boolean;
  /** Parent name as typed; typing drives the debounced search. Ignored when `split` is set. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Render Họ + Tên inputs instead of a single full-name input. */
  split?: SplitName;
  /** Parent picked from the suggestions; the parent fields follow it. */
  linked: ParentOption | null;
  onLink: (parent: ParentOption) => void;
  /** Called when the typed name no longer matches `linked` (the link is dropped). */
  onUnlink?: () => void;
  disabled?: boolean;
  /** Hide the "trùng tên" suggestion list (the name inputs still work as plain fields). */
  hideSuggestions?: boolean;
  /** Validation error for the typed name (shown under the input). */
  error?: string;
};

/**
 * Parent-name field with suggestions: after a debounce it lists existing PARENT users whose
 * name matches the typed text, then users with a similar name (typo / partial word).
 */
export function ParentPicker({
  label,
  placeholder,
  required,
  value: singleValue = "",
  onValueChange,
  split,
  linked,
  onLink,
  onUnlink,
  disabled,
  hideSuggestions = false,
  error,
}: ParentPickerProps) {
  const copy = useStudentsCopy();
  const { language } = useLocale();
  const value = split
    ? formatPersonName(split.firstName, split.lastName, language)
    : singleValue;
  const search = useDebounce(value.trim(), 300);
  const hasSearch = search.length > 0;
  const enabled = hasSearch && !disabled && !hideSuggestions;

  // Full term: finds names containing the typed text.
  const byTerm = useUserActions({
    list: { page: 1, limit: 20, search, role: "PARENT" },
    listOptions: { enabled },
  }).list;
  // Longest word: finds similar names the full term misses (e.g. "Nguyen" in "Nguyễn Văn A").
  const word = longestWord(search);
  const byWord = useUserActions({
    list: { page: 1, limit: 20, search: word, role: "PARENT" },
    listOptions: { enabled: enabled && word.length >= 2 && word !== search },
  }).list;

  const pool = new Map<string, ApiManagedUser>();
  for (const user of [...(byTerm.data?.users ?? []), ...(byWord.data?.users ?? [])]) {
    pool.set(user.id, user);
  }
  const ranked: Suggestion[] = [];
  pool.forEach((user) => {
    const parent = toParentOption(user, language);
    const match = matchParentName(parent.name, search);
    if (match) ranked.push({ parent, match });
  });
  const matched = ranked.filter((s) => s.match !== "similar").slice(0, SUGGESTION_LIMIT);
  const similar = ranked.filter((s) => s.match === "similar").slice(0, SUGGESTION_LIMIT);
  const isFetching = byTerm.isFetching || byWord.isFetching;

  // Once a parent is picked the name field shows that parent; hide the list until the user types again.
  const showSuggestions = enabled && value.trim() !== linked?.name;

  const handleChange = (next: string) => {
    onValueChange?.(next);
    if (linked && next.trim() !== linked.name) onUnlink?.();
  };

  const handleSplitChange = (part: "last" | "first", next: string) => {
    if (!split) return;
    if (part === "last") split.onLastNameChange(next);
    else split.onFirstNameChange(next);
    const combined = formatPersonName(
      part === "first" ? next : split.firstName,
      part === "last" ? next : split.lastName,
      language,
    );
    if (linked && combined.trim() !== linked.name) onUnlink?.();
  };

  const handlePick = (parent: ParentOption) => {
    onLink(parent);
    if (split) {
      split.onLastNameChange(parent.lastName);
      split.onFirstNameChange(parent.firstName);
    } else {
      onValueChange?.(parent.name);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {split ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={split.lastLabel}
            htmlFor="parent-picker-last-name"
            required={split.required}
            error={split.lastError}
          >
            <Input
              id="parent-picker-last-name"
              value={split.lastName}
              onChange={(e) => handleSplitChange("last", e.target.value)}
              placeholder={split.lastPlaceholder}
              disabled={disabled}
              invalid={!!split.lastError}
              autoComplete="off"
            />
          </FormField>
          <FormField
            label={split.firstLabel}
            htmlFor="parent-picker-first-name"
            required={split.required}
            error={split.firstError}
          >
            <Input
              id="parent-picker-first-name"
              value={split.firstName}
              onChange={(e) => handleSplitChange("first", e.target.value)}
              placeholder={split.firstPlaceholder}
              disabled={disabled}
              invalid={!!split.firstError}
              autoComplete="off"
            />
          </FormField>
        </div>
      ) : (
        <FormField label={label} htmlFor="parent-picker-name" required={required} error={error}>
          <Input
            id="parent-picker-name"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            invalid={!!error}
            autoComplete="off"
          />
        </FormField>
      )}

      {showSuggestions && (
        <div className="flex flex-col gap-2">
          {matched.length === 0 && similar.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {isFetching ? copy.parentPicker.searching : copy.parentPicker.noResults}
            </p>
          )}
          {matched.length > 0 && (
            <SuggestionGroup title={copy.parentPicker.matchedGroup} items={matched} onPick={handlePick} />
          )}
          {similar.length > 0 && (
            <SuggestionGroup title={copy.parentPicker.similarGroup} items={similar} onPick={handlePick} />
          )}
        </div>
      )}

    </div>
  );
}

function SuggestionGroup({
  title,
  items,
  onPick,
}: {
  title: string;
  items: Suggestion[];
  onPick: (parent: ParentOption) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-input bg-surface-container-lowest">
        {items.map(({ parent }) => (
          <Button
            key={parent.id}
            type="button"
            variant="ghost"
            onClick={() => onPick(parent)}
            className="h-auto! w-full! justify-start! rounded-none! px-3! py-2! text-left"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{parent.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {parent.phone || parent.email || ""}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
