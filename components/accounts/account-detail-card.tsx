import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Pencil,
  } from "lucide-react";

import { useAccountsCopy } from "@/hooks/useAccountsCopy.hook";
import {
  formatBalance,
  formatSignedAmount,
  WALLET_TYPE_COLOR,
  type Account,
  type ApiTransaction,
  type WalletApiType,
} from "./accounts.data";
import { DeleteIcon } from "@/components/ui/delete-icon.ui";

type AccountDetailCardProps = {
  account: Account;
  icon: typeof ArrowUpRight;
  transactionCountThisMonth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  recentTransactions: ApiTransaction[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export const AccountDetailCard = ({
  account,
  icon: Icon,
  transactionCountThisMonth,
  monthlyIncome,
  monthlyExpense,
  recentTransactions,
  onEdit,
  onDelete,
}: AccountDetailCardProps) => {
  const copy = useAccountsCopy();
  const color = WALLET_TYPE_COLOR[account.type as WalletApiType];
  const negative = account.balance < 0;

  return (
    <article className="dash-card group flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: color }}
          >
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{account.name}</p>
            <p className="text-xs text-muted-foreground">
              {copy.card.transactionsThisMonth(transactionCountThisMonth)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="text-right">
            <p
              className={`text-lg font-bold tabular-nums ${
                negative ? "text-negative" : "text-foreground"
              }`}
            >
              {formatBalance(account.balance, account.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {copy.card.currentBalance}
            </p>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              aria-label={copy.card.editAria(account.name)}
              onClick={() => onEdit(account)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={copy.card.deleteAria(account.name)}
              onClick={() => onDelete(account)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-positive/10 px-3 py-2">
          <ArrowDownLeft className="size-3.5 shrink-0 text-positive" />
          <div>
            <p className="text-[11px] text-muted-foreground">
              {copy.card.income}
            </p>
            <p className="text-sm font-semibold text-positive tabular-nums">
              {formatSignedAmount(monthlyIncome, "INCOME", account.currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-negative/10 px-3 py-2">
          <ArrowUpRight className="size-3.5 shrink-0 text-negative" />
          <div>
            <p className="text-[11px] text-muted-foreground">
              {copy.card.expenses}
            </p>
            <p className="text-sm font-semibold text-negative tabular-nums">
              {formatSignedAmount(monthlyExpense, "EXPENSE", account.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-muted-foreground">
          {copy.card.recentTransactions}
        </p>
        {recentTransactions.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            {copy.card.noTransactionsYet}
          </p>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      tx.type === "INCOME" ? "bg-positive" : "bg-negative"
                    }`}
                  />
                  <p className="truncate text-[13px] font-medium">
                    {tx.name || tx.category.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span
                    className={`text-[13px] font-semibold tabular-nums ${
                      tx.type === "INCOME" ? "text-positive" : "text-negative"
                    }`}
                  >
                    {formatSignedAmount(
                      Number(tx.amount),
                      tx.type,
                      account.currency,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
