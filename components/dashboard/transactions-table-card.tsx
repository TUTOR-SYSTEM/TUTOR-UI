"use client";

import { useDashboardCopy } from "@/hooks/useDashboardCopy.hook";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.ui";

const MOCK_ROWS = [
  {
    id: "1",
    transactionKey: "groceryStore",
    categoryKey: "categoryFoodAndDining",
    accountKey: "accountMainCard",
    type: "EXPENSE",
    amount: "-$84.50",
  },
  {
    id: "2",
    transactionKey: "monthlySalary",
    categoryKey: "categoryIncome",
    accountKey: "accountBank",
    type: "INCOME",
    amount: "+$5,200",
  },
  {
    id: "3",
    transactionKey: "netflix",
    categoryKey: "categoryEntertainment",
    accountKey: "accountCredit",
    type: "EXPENSE",
    amount: "-$15.99",
  },
  {
    id: "4",
    transactionKey: "freelanceWork",
    categoryKey: "categoryIncome",
    accountKey: "accountBank",
    type: "INCOME",
    amount: "+$1,200",
  },
  {
    id: "5",
    transactionKey: "electricBill",
    categoryKey: "categoryHousing",
    accountKey: "accountMainCard",
    type: "EXPENSE",
    amount: "-$120.00",
  },
] as const;

export const TransactionsTableCard = () => {
  const copy = useDashboardCopy();
  const rows = copy.transactionsTable.rows;

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">{copy.transactionsTable.title}</h2>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">
                {copy.transactionsTable.colTransaction}
              </TableHead>
              <TableHead className="px-4">
                {copy.transactionsTable.colCategory}
              </TableHead>
              <TableHead className="px-4">
                {copy.transactionsTable.colAccount}
              </TableHead>
              <TableHead className="px-4">
                {copy.transactionsTable.colType}
              </TableHead>
              <TableHead className="px-4">
                {copy.transactionsTable.colAmount}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_ROWS.map((row) => (
              <TableRow
                key={row.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <TableCell className="px-5 py-3 font-medium">
                  {rows[row.transactionKey]}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {rows[row.categoryKey]}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {rows[row.accountKey]}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.type === "INCOME"
                        ? "bg-positive/10 text-positive"
                        : "bg-negative/10 text-negative"
                    }`}
                  >
                    {row.type === "INCOME"
                      ? copy.transactionsTable.typeIncome
                      : copy.transactionsTable.typeExpense}
                  </span>
                </TableCell>
                <TableCell
                  className={`px-4 py-3 font-semibold tabular-nums ${
                    row.type === "INCOME" ? "text-positive" : "text-negative"
                  }`}
                >
                  {row.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
