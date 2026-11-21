"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Funnel,
  Hash,
  Search,
} from "lucide-react";

import { StatCard } from "@/components/dashboard";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button.ui";
import { useTransactionsCopy } from "@/hooks/useTransactionsCopy.hook";
import { cn } from "@/lib/utils";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.ui";

type TxType = "Income" | "Expense";

type Tx = {
  id: string;
  name: string;
  date: string;
  category: string;
  categoryIcon: string;
  account: string;
  type: TxType;
  amount: number;
  color: string;
};

const TRANSACTIONS: Tx[] = [
  {
    id: "1",
    name: "Monthly Salary",
    date: "Jun 28",
    category: "Salary",
    categoryIcon: "💼",
    account: "Checking",
    type: "Income",
    amount: 6500,
    color: "#67e8f9",
  },
  {
    id: "2",
    name: "Airbnb Design Work",
    date: "Jun 27",
    category: "Freelance",
    categoryIcon: "💻",
    account: "Checking",
    type: "Income",
    amount: 1200,
    color: "#86efac",
  },
  {
    id: "3",
    name: "Whole Foods Market",
    date: "Jun 26",
    category: "Food & Dining",
    categoryIcon: "🍽️",
    account: "Credit Card",
    type: "Expense",
    amount: 187,
    color: "#818cf8",
  },
  {
    id: "4",
    name: "Rent Payment",
    date: "Jun 25",
    category: "Housing",
    categoryIcon: "🏠",
    account: "Checking",
    type: "Expense",
    amount: 1200,
    color: "#bef264",
  },
  {
    id: "5",
    name: "Uber Ride",
    date: "Jun 24",
    category: "Transport",
    categoryIcon: "🚗",
    account: "Credit Card",
    type: "Expense",
    amount: 28,
    color: "#a78bfa",
  },
  {
    id: "6",
    name: "Netflix Subscription",
    date: "Jun 23",
    category: "Entertainment",
    categoryIcon: "🎬",
    account: "Credit Card",
    type: "Expense",
    amount: 18,
    color: "#93c5fd",
  },
  {
    id: "7",
    name: "Zara Online",
    date: "Jun 22",
    category: "Shopping",
    categoryIcon: "🛍️",
    account: "Credit Card",
    type: "Expense",
    amount: 145,
    color: "#f9a8d4",
  },
  {
    id: "8",
    name: "Dividend Payment",
    date: "Jun 21",
    category: "Investment",
    categoryIcon: "📈",
    account: "Savings",
    type: "Income",
    amount: 500,
    color: "#a5b4fc",
  },
  {
    id: "9",
    name: "Starbucks",
    date: "Jun 20",
    category: "Food & Dining",
    categoryIcon: "🍽️",
    account: "Credit Card",
    type: "Expense",
    amount: 12,
    color: "#f9a8d4",
  },
  {
    id: "10",
    name: "Gym Membership",
    date: "Jun 19",
    category: "Health",
    categoryIcon: "💊",
    account: "Checking",
    type: "Expense",
    amount: 45,
    color: "#fda4af",
  },
  {
    id: "11",
    name: "Electricity Bill",
    date: "Jun 18",
    category: "Utilities",
    categoryIcon: "💡",
    account: "Checking",
    type: "Expense",
    amount: 96,
    color: "#7dd3fc",
  },
  {
    id: "12",
    name: "Uber Ride",
    date: "Jun 17",
    category: "Transport",
    categoryIcon: "🚗",
    account: "Credit Card",
    type: "Expense",
    amount: 22,
    color: "#a78bfa",
  },
  {
    id: "13",
    name: "Trader Joe's",
    date: "Jun 16",
    category: "Food & Dining",
    categoryIcon: "🍽️",
    account: "Credit Card",
    type: "Expense",
    amount: 65,
    color: "#818cf8",
  },
  {
    id: "14",
    name: "Freelance Project",
    date: "Jun 15",
    category: "Freelance",
    categoryIcon: "💻",
    account: "Checking",
    type: "Income",
    amount: 650,
    color: "#86efac",
  },
  {
    id: "15",
    name: "Spotify Premium",
    date: "Jun 14",
    category: "Entertainment",
    categoryIcon: "🎬",
    account: "Credit Card",
    type: "Expense",
    amount: 11,
    color: "#93c5fd",
  },
  {
    id: "16",
    name: "Water Bill",
    date: "Jun 13",
    category: "Utilities",
    categoryIcon: "💡",
    account: "Checking",
    type: "Expense",
    amount: 40,
    color: "#7dd3fc",
  },
  {
    id: "17",
    name: "Amazon Order",
    date: "Jun 12",
    category: "Shopping",
    categoryIcon: "🛍️",
    account: "Credit Card",
    type: "Expense",
    amount: 78,
    color: "#f9a8d4",
  },
  {
    id: "18",
    name: "Uber Ride",
    date: "Jun 11",
    category: "Transport",
    categoryIcon: "🚗",
    account: "Credit Card",
    type: "Expense",
    amount: 15,
    color: "#a78bfa",
  },
  {
    id: "19",
    name: "Tax Refund",
    date: "Jun 10",
    category: "Other",
    categoryIcon: "📦",
    account: "Checking",
    type: "Income",
    amount: 500,
    color: "#fcd34d",
  },
  {
    id: "20",
    name: "Pharmacy",
    date: "Jun 09",
    category: "Health",
    categoryIcon: "💊",
    account: "Checking",
    type: "Expense",
    amount: 38,
    color: "#fda4af",
  },
  {
    id: "21",
    name: "Coffee Shop",
    date: "Jun 08",
    category: "Food & Dining",
    categoryIcon: "🍽️",
    account: "Credit Card",
    type: "Expense",
    amount: 19,
    color: "#818cf8",
  },
  {
    id: "22",
    name: "Movie Night",
    date: "Jun 07",
    category: "Entertainment",
    categoryIcon: "🎬",
    account: "Credit Card",
    type: "Expense",
    amount: 34,
    color: "#93c5fd",
  },
  {
    id: "23",
    name: "Internet Bill",
    date: "Jun 06",
    category: "Utilities",
    categoryIcon: "💡",
    account: "Checking",
    type: "Expense",
    amount: 60,
    color: "#7dd3fc",
  },
  {
    id: "24",
    name: "H&M",
    date: "Jun 05",
    category: "Shopping",
    categoryIcon: "🛍️",
    account: "Credit Card",
    type: "Expense",
    amount: 52,
    color: "#f9a8d4",
  },
  {
    id: "25",
    name: "Uber Ride",
    date: "Jun 04",
    category: "Transport",
    categoryIcon: "🚗",
    account: "Credit Card",
    type: "Expense",
    amount: 21,
    color: "#a78bfa",
  },
  {
    id: "26",
    name: "Doctor Visit",
    date: "Jun 03",
    category: "Health",
    categoryIcon: "💊",
    account: "Checking",
    type: "Expense",
    amount: 60,
    color: "#fda4af",
  },
  {
    id: "27",
    name: "Grocery Store",
    date: "Jun 02",
    category: "Food & Dining",
    categoryIcon: "🍽️",
    account: "Credit Card",
    type: "Expense",
    amount: 96,
    color: "#818cf8",
  },
  {
    id: "28",
    name: "Insurance Premium",
    date: "Jun 01",
    category: "Other",
    categoryIcon: "📦",
    account: "Checking",
    type: "Expense",
    amount: 367,
    color: "#fcd34d",
  },
];

type SortKey = "name" | "category" | "account" | "amount";
type SortDirection = "asc" | "desc";

const PER_PAGE_OPTIONS = [8, 16, 24];

const SortIcon = ({ active }: { active: boolean }) => (
  <ArrowUpDown
    className={cn(
      "size-3",
      active ? "text-foreground" : "text-muted-foreground/60",
    )}
  />
);

const currency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Tìm giao dịch",
    body: (
      <>
        Gõ tên hoặc danh mục vào ô{" "}
        <span className="font-semibold">tìm kiếm</span> ở góc trên để lọc
        nhanh danh sách.
      </>
    ),
  },
  {
    n: 2,
    title: "Sắp xếp cột",
    body: (
      <>
        Nhấn tiêu đề cột{" "}
        <span className="font-semibold">
          Giao dịch / Danh mục / Tài khoản / Số tiền
        </span>{" "}
        để sắp xếp tăng hoặc giảm dần.
      </>
    ),
  },
  {
    n: 3,
    title: "Chọn nhiều dòng",
    body: "Tick vào ô vuông đầu mỗi dòng, hoặc ô ở tiêu đề để chọn cả trang, nhằm đánh dấu nhiều giao dịch cùng lúc.",
  },
  {
    n: 4,
    title: "Phân trang",
    body: "Chọn số dòng/trang và dùng các nút điều hướng ở cuối bảng để xem thêm giao dịch.",
  },
];

const USAGE_GUIDE_WARNING = (
  <>
    <span className="font-semibold text-positive">Số dương (xanh)</span> là
    khoản thu, <span className="font-semibold text-negative">số âm (đỏ)</span>{" "}
    là khoản chi — kiểm tra kỹ trước khi đối chiếu sổ sách.
  </>
);

export const TransactionsPage = () => {
  const copy = useTransactionsCopy();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState(8);
  const [page, setPage] = useState(1);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = TRANSACTIONS.filter((tx) => {
      if (term.length === 0) {
        return true;
      }
      return (
        tx.name.toLowerCase().includes(term) ||
        tx.category.toLowerCase().includes(term)
      );
    });

    if (!sortKey) {
      return result;
    }

    const sorted = [...result].sort((a, b) => {
      if (sortKey === "amount") {
        return a.amount - b.amount;
      }
      return a[sortKey].localeCompare(b[sortKey]);
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [search, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const totals = useMemo(() => {
    const income = TRANSACTIONS.filter((t) => t.type === "Income").reduce(
      (s, t) => s + t.amount,
      0,
    );
    const expense = TRANSACTIONS.filter((t) => t.type === "Expense").reduce(
      (s, t) => s + t.amount,
      0,
    );
    const incomeCount = TRANSACTIONS.filter((t) => t.type === "Income").length;
    const expenseCount = TRANSACTIONS.filter(
      (t) => t.type === "Expense",
    ).length;
    return {
      income,
      expense,
      net: income - expense,
      incomeCount,
      expenseCount,
    };
  }, []);

  const allSelectedOnPage =
    paged.length > 0 && paged.every((tx) => selected.has(tx.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        paged.forEach((tx) => next.delete(tx.id));
      } else {
        paged.forEach((tx) => next.add(tx.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 pb-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title={copy.stats.totalIncome}
          value={`+${currency(totals.income)}`}
          change={copy.stats.incomeCount(totals.incomeCount)}
          captionOnly
          icon={<ArrowDownLeft />}
          iconClassName="size-3.5 text-emerald-600"
          iconWrapperClassName="bg-emerald-500/10"
        />
        <StatCard
          title={copy.stats.totalExpenses}
          value={`-${currency(totals.expense)}`}
          change={copy.stats.expenseCount(totals.expenseCount)}
          captionOnly
          icon={<ArrowUpRight />}
          iconClassName="size-3.5 text-rose-600"
          iconWrapperClassName="bg-rose-500/10"
        />
        <StatCard
          title={copy.stats.netCashFlow}
          value={currency(totals.net)}
          change={copy.stats.thisMonth}
          captionOnly
          icon={<ArrowLeftRight />}
          iconClassName="size-3.5 text-orange-600"
          iconWrapperClassName="bg-orange-500/10"
        />
        <StatCard
          title={copy.stats.transactions}
          value={String(TRANSACTIONS.length)}
          change={copy.stats.totalRecorded}
          captionOnly
          icon={<Hash />}
          iconClassName="size-3.5 text-violet-600"
          iconWrapperClassName="bg-violet-500/10"
        />
      </section>

      <DashboardSection
        title={copy.section.title}
        subtitle={
          <>
            <span className="font-medium text-positive">
              +{currency(totals.income)}
            </span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium text-negative">
              -{currency(totals.expense)}
            </span>
          </>
        }
        actions={
          <>
            <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
              <Search className="size-4" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-44 bg-transparent outline-none placeholder:text-muted-foreground"
                placeholder={copy.toolbar.searchPlaceholder}
              />
            </label>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors hover:bg-muted"
            >
              <Funnel className="size-4" />
              {copy.toolbar.filter}
            </button>
          </>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table className="w-full min-w-[720px] text-sm">
            <TableHeader>
              <TableRow className="h-10 border-b border-border/70">
                <TableHead className="w-10 px-3">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={toggleSelectAll}
                    aria-label={copy.table.selectAll}
                  />
                </TableHead>
                <TableHead className="px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {copy.table.transaction}
                    <SortIcon active={sortKey === "name"} />
                  </button>
                </TableHead>
                <TableHead className="px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("category")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {copy.table.category}
                    <SortIcon active={sortKey === "category"} />
                  </button>
                </TableHead>
                <TableHead className="px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("account")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {copy.table.account}
                    <SortIcon active={sortKey === "account"} />
                  </button>
                </TableHead>
                <TableHead className="px-3">
                  {copy.table.type}
                </TableHead>
                <TableHead className="px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("amount")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {copy.table.amount}
                    <SortIcon active={sortKey === "amount"} />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((tx) => {
                const positive = tx.type === "Income";
                return (
                  <TableRow
                    key={tx.id}
                    className="h-14 border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/40"
                  >
                    <TableCell className="px-3 align-middle">
                      <input
                        type="checkbox"
                        checked={selected.has(tx.id)}
                        onChange={() => toggleSelectOne(tx.id)}
                        aria-label={copy.table.selectRow(tx.name)}
                      />
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-8 shrink-0 rounded-full"
                          style={{ backgroundColor: tx.color }}
                        />
                        <div>
                          <p className="font-medium leading-4">{tx.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.date}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{tx.categoryIcon}</span>
                        {tx.category}
                      </span>
                    </TableCell>
                    <TableCell className="px-3">
                      <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                        {tx.account}
                      </span>
                    </TableCell>
                    <TableCell className="px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          positive ? "text-positive" : "text-negative"
                        }`}
                      >
                        {positive ? (
                          <ArrowDownLeft className="size-3" />
                        ) : (
                          <ArrowUpRight className="size-3" />
                        )}
                        {positive ? copy.table.typeIncome : copy.table.typeExpense}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`px-3 font-semibold tabular-nums ${
                        positive ? "text-positive" : "text-foreground"
                      }`}
                    >
                      {positive ? "+" : "-"}
                      {currency(tx.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}

              {paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    {copy.table.noMatch}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {copy.pagination.showing(
                filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1,
                Math.min(safePage * perPage, filtered.length),
                filtered.length,
              )}
            </span>
            <label className="flex items-center gap-1.5">
              {copy.pagination.perPage}
              <select
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-sm text-foreground outline-none"
              >
                {PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {copy.pagination.pageOf(safePage, totalPages)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage <= 1}
              onClick={() => setPage(1)}
              aria-label={copy.pagination.firstPage}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={copy.pagination.previousPage}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label={copy.pagination.nextPage}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label={copy.pagination.lastPage}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </DashboardSection>

      <UsageGuides steps={USAGE_GUIDE_STEPS} warning={USAGE_GUIDE_WARNING} />
    </div>
  );
};
