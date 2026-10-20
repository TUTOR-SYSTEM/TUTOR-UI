"use client";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { longestWord, matchParentName, type ParentMatch } from "@/lib/parent-match";
import { useUserActions } from "@/lib/services/user.service";
import type { ApiManagedUser, ParentOption } from "@/types";

const SUGGESTION_LIMIT = 5;

export function toParentOption(user: ApiManagedUser): ParentOption {
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "",
    phone: user.phone ?? null,
    email: user.email ?? null,
  };
}

type Suggestion = { parent: ParentOption; match: ParentMatch };

type ParentPickerProps = {
  label: string;
  placeholder: string;
  required?: boolean;
  /** Parent name as typed; typing drives the debounced search. */
  value: string;
  onValueChange: (value: string) => void;
  /** Parent picked from the suggestions; the parent fields follow it. */
  linked: ParentOption | null;
  onLink: (parent: ParentOption) => void;
  /** Called when the typed name no longer matches `linked` (the link is dropped). */
  onUnlink?: () => void;
  disabled?: boolean;
};

/**
 * Parent-name field with suggestions: after a debounce it lists existing PARENT users whose
 * name matches the typed text, then users with a similar name (typo / partial word).
 */
export function ParentPicker({
  label,
  placeholder,
  required,
  value,
  onValueChange,
  linked,
  onLink,
  onUnlink,
  disabled,
}: ParentPickerProps) {
  const copy = useStudentsCopy();
  const search = useDebounce(value.trim(), 300);
  const hasSearch = search.length > 0;
  const enabled = hasSearch && !disabled;

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
    const parent = toParentOption(user);
    const match = matchParentName(parent.name, search);
    if (match) ranked.push({ parent, match });
  });
  const matched = ranked.filter((s) => s.match !== "similar").slice(0, SUGGESTION_LIMIT);
  const similar = ranked.filter((s) => s.match === "similar").slice(0, SUGGESTION_LIMIT);
  const isFetching = byTerm.isFetching || byWord.isFetching;

  // Once a parent is picked the name field shows that parent; hide the list until the user types again.
  const showSuggestions = enabled && value.trim() !== linked?.name;

  const handleChange = (next: string) => {
    onValueChange(next);
    if (linked && next.trim() !== linked.name) onUnlink?.();
  };

  const handlePick = (parent: ParentOption) => {
    onLink(parent);
    onValueChange(parent.name);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

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
