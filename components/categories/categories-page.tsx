"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Tags } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { StatCard } from "@/components/dashboard";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button.ui";
import { useGet, usePost, usePut, useDelete } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { getErrorMessage } from "@/lib/axios";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type Category,
  type CategoryFormValues,
  type CategoryType,
} from "./categories.data";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";

// ── API types ────────────────────────────────────────────────────────────────

type ApiCategory = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  parentId: string | null;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

type CategoriesApiPayload = {
  data: ApiCategory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type CreateCategoryPayload = {
  userId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
  color?: string;
  parent_id?: string | null;
};

type UpdateCategoryPayload = {
  id: string;
  name?: string;
  type?: "INCOME" | "EXPENSE";
  icon?: string;
  color?: string;
  parent_id?: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toApiType(type: CategoryType): "INCOME" | "EXPENSE" {
  return type === "Income" ? "INCOME" : "EXPENSE";
}

function mapApiCategory(api: ApiCategory, allApi: ApiCategory[]): Category {
  const parentName = api.parentId
    ? allApi.find((c) => c.id === api.parentId)?.name
    : undefined;
  return {
    id: api.id,
    name: api.name,
    type: api.type === "INCOME" ? "Income" : "Expense",
    icon: api.icon ?? CATEGORY_ICONS[0]!,
    color: api.color ?? CATEGORY_COLORS[0]!,
    parent: parentName,
    txCount: 0,
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES_QUERY_KEY = ["categories", "list"] as const;
const TYPE_FILTERS = ["All", "Income", "Expense"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

type FormState = {
  open: boolean;
  mode: "add" | "edit";
  category: Category | null;
};

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Filter by type",
    body: (
      <>
        Use the{" "}
        <span className="font-semibold text-[#16302b] dark:text-foreground">
          All / Income / Expense
        </span>{" "}
        tabs above the grid to narrow the list.
      </>
    ),
  },
  {
    n: 2,
    title: "Add a category",
    body: (
      <>
        Click{" "}
        <span className="font-semibold text-[#0E9F8E] dark:text-[#2DD4BF]">+ New category</span> to
        create one with a custom icon and color.
      </>
    ),
  },
  {
    n: 3,
    title: "Edit or delete",
    body: (
      <>
        Hover a category card and use the{" "}
        <span className="font-semibold text-[#16302b] dark:text-foreground">✏️ / 🗑️</span> icons that
        appear to edit or remove it.
      </>
    ),
  },
  {
    n: 4,
    title: "Parent grouping",
    body: (
      <>
        Categories can be nested under a{" "}
        <span className="font-semibold text-[#16302b] dark:text-foreground">parent category</span>,
        shown under the category name.
      </>
    ),
  },
];

const USAGE_GUIDE_WARNING = (
  <>
    <span className="font-semibold text-[#E85D24] dark:text-[#FF9A6C]">Note:</span> Deleting a
    category is permanent — transactions using it will need to be reassigned.
  </>
);

// ── Component ─────────────────────────────────────────────────────────────────

export const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUserId();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [form, setForm] = useState<FormState>({
    open: false,
    mode: "add",
    category: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: apiPayload,
    isPending,
    isError,
    error,
  } = useGet<unknown, CategoriesApiPayload>(
    CATEGORIES_QUERY_KEY,
    "/categories",
    {
      params: { page: 1, limit: 100 },
      select: (raw) => unwrapApiData<CategoriesApiPayload>(raw),
    },
  );

  const items: Category[] = useMemo(() => {
    const apiCategories = apiPayload?.data ?? [];
    return apiCategories.map((c) => mapApiCategory(c, apiCategories));
  }, [apiPayload]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });

  const createMutation = usePost<unknown, CreateCategoryPayload>(
    "/categories",
    {
      onSuccess: (_, variables) => {
        invalidate();
        toast.success(`Created "${variables.name}"`);
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, "Failed to create category")),
    },
  );

  const updateMutation = usePut<unknown, UpdateCategoryPayload>(
    (payload) => `/categories/${payload.id}`,
    {
      onSuccess: (_, variables) => {
        invalidate();
        toast.success(`Updated "${variables.name ?? "category"}"`);
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, "Failed to update category")),
    },
  );

  const deleteMutation = useDelete<unknown, string>(
    (id) => `/categories/${id}`,
    {
      onSuccess: () => {
        invalidate();
        toast.success("Category deleted");
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, "Failed to delete category")),
    },
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAdd = () => setForm({ open: true, mode: "add", category: null });
  const openEdit = (category: Category) =>
    setForm({ open: true, mode: "edit", category });
  const closeForm = () => setForm((prev) => ({ ...prev, open: false }));

  const handleSubmit = (values: CategoryFormValues) => {
    const parentId = values.parent ?? null;

    if (form.mode === "edit" && form.category) {
      updateMutation.mutate({
        id: form.category.id,
        name: values.name,
        type: toApiType(values.type),
        icon: values.icon,
        color: values.color,
        parent_id: parentId,
      });
    } else {
      createMutation.mutate({
        userId: currentUserId ?? "",
        name: values.name,
        type: toApiType(values.type),
        icon: values.icon,
        color: values.color,
        parent_id: parentId,
      });
    }
    closeForm();
  };

  const handleDelete = (category: Category) => {
    deleteMutation.mutate(category.id);
    setDeleteTarget(null);
  };

  // ── Derived UI state ──────────────────────────────────────────────────────

  const filtered = useMemo(
    () => items.filter((c) => typeFilter === "All" || c.type === typeFilter),
    [items, typeFilter],
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      income: items.filter((c) => c.type === "Income").length,
      expense: items.filter((c) => c.type === "Expense").length,
    }),
    [items],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Categories</h1>
          <p className="page-description">
            Organize transactions with income and expense categories.
          </p>
        </div>
        <Button size="default" className="w-auto gap-2 px-4" onClick={openAdd}>
          + New category
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Categories"
          value={String(counts.total)}
          change="Across income & expense"
          icon={<Tags className="size-4" />}
        />
        <StatCard
          title="Income Categories"
          value={String(counts.income)}
          change="Sources of income"
          icon={<ArrowUpRight className="size-4" />}
        />
        <StatCard
          title="Expense Categories"
          value={String(counts.expense)}
          change="Where money goes"
          positive={false}
          icon={<ArrowDownLeft className="size-4" />}
        />
      </section>

      <DashboardSection
        title="All Categories"
        subtitle={`${filtered.length} of ${items.length} categories`}
      >
        {isPending ? (
          <div className="flex min-h-50 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Loading categories…
          </div>
        ) : isError ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center text-sm">
            <p className="text-destructive">{getErrorMessage(error)}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {TYPE_FILTERS.map((filter) => {
                const active = typeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTypeFilter(filter)}
                    className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No categories match this filter.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((category) => {
                  const income = category.type === "Income";
                  return (
                    <article
                      key={category.id}
                      className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card/40 p-3 transition-colors hover:bg-muted/40"
                    >
                      <span
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-lg"
                        style={{ backgroundColor: `${category.color}22` }}
                      >
                        {category.icon}
                      </span>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <p className="truncate text-sm font-medium">
                            {category.name}
                          </p>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {category.parent ? `${category.parent} · ` : ""}
                          {category.txCount} transactions
                        </p>
                      </div>

                      <span
                        className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${
                          income
                            ? "bg-positive/10 text-positive"
                            : "bg-negative/10 text-negative"
                        }`}
                      >
                        {category.type}
                      </span>

                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => openEdit(category)}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${category.name}`}
                          onClick={() => setDeleteTarget(category)}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          🗑️
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </DashboardSection>

      {form.open ? (
        <CategoryFormDialog
          key={form.category?.id ?? "new"}
          open={form.open}
          mode={form.mode}
          initial={form.category}
          parentOptions={items}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      ) : null}

      <DeleteCategoryDialog
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <UsageGuides steps={USAGE_GUIDE_STEPS} warning={USAGE_GUIDE_WARNING} />
    </div>
  );
};
