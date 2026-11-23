"use client";

import { ChevronsUpDown, DollarSign, Percent, TrendingUp } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.ui";

type Category = "Technology" | "ETF" | "Other";

type Holding = {
  id: string;
  symbol: string;
  name: string;
  category: Category;
  shares: number;
  price: number;
  value: number;
  gain: number;
  color: string;
};

const HOLDINGS: Holding[] = [
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "Technology",
    shares: 15,
    price: 196.45,
    value: 2947,
    gain: 767,
    color: "#2563eb",
  },
  {
    id: "msft",
    symbol: "MSFT",
    name: "Microsoft Corp.",
    category: "Technology",
    shares: 8,
    price: 419.75,
    value: 3358,
    gain: 881,
    color: "#1d4ed8",
  },
  {
    id: "voo",
    symbol: "VOO",
    name: "Vanguard S&P 500",
    category: "ETF",
    shares: 10,
    price: 584.1,
    value: 5841,
    gain: 650,
    color: "#16a34a",
  },
  {
    id: "amzn",
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    category: "Other",
    shares: 5,
    price: 186.8,
    value: 934,
    gain: 50,
    color: "#f97316",
  },
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    category: "Technology",
    shares: 60,
    price: 145.9,
    value: 8754,
    gain: 3553,
    color: "#22c55e",
  },
  {
    id: "tsla",
    symbol: "TSLA",
    name: "Tesla Inc.",
    category: "Other",
    shares: 20,
    price: 248.25,
    value: 4965,
    gain: 200,
    color: "#ef4444",
  },
  {
    id: "agg",
    symbol: "AGG",
    name: "iShares Core Bond",
    category: "Other",
    shares: 24,
    price: 101,
    value: 2424,
    gain: -575,
    color: "#94a3b8",
  },
];

const PORTFOLIO_VALUE = HOLDINGS.reduce((sum, h) => sum + h.value, 0);
const TOTAL_GAIN = HOLDINGS.reduce((sum, h) => sum + h.gain, 0);
const COST_BASIS = PORTFOLIO_VALUE - TOTAL_GAIN;
const TOTAL_RETURN_PCT = (TOTAL_GAIN / COST_BASIS) * 100;

const topGainer = HOLDINGS.reduce((best, h) => {
  const pct = h.gain / (h.value - h.gain);
  const bestPct = best.gain / (best.value - best.gain);
  return pct > bestPct ? h : best;
}, HOLDINGS[0]);
const topGainerPct =
  (topGainer.gain / (topGainer.value - topGainer.gain)) * 100;

const biggestHolding = HOLDINGS.reduce(
  (max, h) => (h.value > max.value ? h : max),
  HOLDINGS[0],
);

const categoryCounts = HOLDINGS.reduce<Record<Category, number>>(
  (acc, h) => {
    acc[h.category] += 1;
    return acc;
  },
  { Technology: 0, ETF: 0, Other: 0 },
);

const currency = (value: number, fractionDigits = 0) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
  });

const conicGradient = (() => {
  let cursor = 0;
  const stops = HOLDINGS.map((h) => {
    const start = (cursor / PORTFOLIO_VALUE) * 360;
    cursor += h.value;
    const end = (cursor / PORTFOLIO_VALUE) * 360;
    return `${h.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
})();

const MONTHS = [
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
];
const PERFORMANCE_VALUES = [
  18900, 19200, 19050, 19400, 20100, 21100, 23200, 22600, 23900, 26200, 27300,
  29206,
];

const performancePath = (() => {
  const maxValue = 30000;
  const width = 760;
  const height = 260;
  const step = width / (PERFORMANCE_VALUES.length - 1);
  const points = PERFORMANCE_VALUES.map((value, i) => {
    const x = i * step;
    const y = height - (value / maxValue) * height;
    return { x, y };
  });

  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    d += ` C${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return { d, points, height, width };
})();

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Allocation chart",
    body: (
      <>
        The donut chart shows how your portfolio value is split across
        holdings; each legend row lists its share.
      </>
    ),
  },
  {
    n: 2,
    title: "Performance",
    body: (
      <>
        The line chart tracks 12-month value.{" "}
        <span className="font-semibold text-[#16302b]">
          Growth / Top Gainer / Biggest Holding
        </span>{" "}
        summarize the trend below it.
      </>
    ),
  },
  {
    n: 3,
    title: "Holdings table",
    body: (
      <>
        Each row lists shares, price, current value and{" "}
        <span className="font-semibold text-[#16302b]">gain/loss</span> for
        one holding.
      </>
    ),
  },
  {
    n: 4,
    title: "Allocation bar",
    body: (
      <>
        The bar in the last column shows a holding&apos;s weight relative to
        the total portfolio value.
      </>
    ),
  },
];

export const InvestmentsPage = () => {
  return (
    <div className="space-y-4 pb-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <article className="rounded-xl border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Portfolio Value
            </span>
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            {currency(PORTFOLIO_VALUE)}
          </span>
          <span className="text-xs text-muted-foreground">
            {HOLDINGS.length} holdings
          </span>
        </article>

        <article className="rounded-xl border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Gain
            </span>
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-positive">
            +{currency(TOTAL_GAIN)}
          </span>
          <span className="text-xs text-muted-foreground">vs. cost basis</span>
        </article>

        <article className="rounded-xl border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Return
            </span>
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="size-3.5 text-primary" aria-hidden="true" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-positive">
            +{TOTAL_RETURN_PCT.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">All time</span>
        </article>

        <article className="rounded-xl border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cost Basis
            </span>
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            {currency(COST_BASIS)}
          </span>
          <span className="text-xs text-muted-foreground">Total invested</span>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DashboardSection
          title="Allocation"
          subtitle="Portfolio distribution"
          className="xl:col-span-1"
        >
          <div className="flex flex-col items-center gap-6">
            <div
              className="relative size-36 shrink-0 rounded-full"
              style={{ background: conicGradient }}
            >
              <div className="absolute inset-5 flex items-center justify-center rounded-full bg-card text-center shadow-inner">
                <div>
                  <p className="text-lg font-bold tabular-nums">
                    {HOLDINGS.length}
                  </p>
                  <p className="text-xs text-muted-foreground">holdings</p>
                </div>
              </div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {HOLDINGS.map((holding) => (
                <li
                  key={holding.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: holding.color }}
                    />
                    <span className="font-medium">{holding.symbol}</span>
                    <span className="text-muted-foreground">
                      {holding.name}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {((holding.value / PORTFOLIO_VALUE) * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Portfolio Performance"
          subtitle="12-month value history"
          className="xl:col-span-2"
        >
          <div className="overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-muted/10 to-transparent p-3">
            <div className="flex gap-2">
              <div className="flex flex-col justify-between py-1 text-xs text-muted-foreground">
                <span>$30k</span>
                <span>$23k</span>
                <span>$15k</span>
                <span>$8k</span>
                <span>$0k</span>
              </div>
              <svg
                viewBox={`0 0 ${performancePath.width} ${performancePath.height}`}
                className="h-56 w-full"
              >
                <defs>
                  <linearGradient
                    id="performance-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity="0.18"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <g
                  className="text-border"
                  stroke="currentColor"
                  strokeDasharray="4 6"
                >
                  <line x1="0" y1="0" x2={performancePath.width} y2="0" />
                  <line
                    x1="0"
                    y1={performancePath.height * 0.25}
                    x2={performancePath.width}
                    y2={performancePath.height * 0.25}
                  />
                  <line
                    x1="0"
                    y1={performancePath.height * 0.5}
                    x2={performancePath.width}
                    y2={performancePath.height * 0.5}
                  />
                  <line
                    x1="0"
                    y1={performancePath.height * 0.75}
                    x2={performancePath.width}
                    y2={performancePath.height * 0.75}
                  />
                  <line
                    x1="0"
                    y1={performancePath.height}
                    x2={performancePath.width}
                    y2={performancePath.height}
                  />
                </g>
                <path
                  d={`${performancePath.d} L${performancePath.width} ${performancePath.height} L0 ${performancePath.height} Z`}
                  fill="url(#performance-fill)"
                  stroke="none"
                />
                <path
                  d={performancePath.d}
                  fill="none"
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="mt-1 flex justify-between pl-8 text-xs text-muted-foreground">
              {MONTHS.map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-border/70 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Growth</p>
              <p className="text-lg font-bold text-positive">
                +{TOTAL_RETURN_PCT.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">All time</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top Gainer</p>
              <p className="text-lg font-bold text-positive">
                +{topGainerPct.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {topGainer.symbol}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Biggest Holding</p>
              <p className="text-lg font-bold">
                {currency(biggestHolding.value)}
              </p>
              <p className="text-xs text-muted-foreground">
                {biggestHolding.symbol}
              </p>
            </div>
          </div>
        </DashboardSection>
      </section>

      <DashboardSection
        title="Holdings"
        subtitle={`${HOLDINGS.length} positions in your portfolio`}
        actions={
          <>
            {(Object.entries(categoryCounts) as [Category, number][])
              .filter(([, count]) => count > 0)
              .map(([category, count]) => (
                <span
                  key={category}
                  className="rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {count} {category}
                </span>
              ))}
          </>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table className="w-full min-w-[760px] text-sm">
            <TableHeader>
              <TableRow className="border-b border-border/70">
                <TableHead className="px-3">
                  <span className="inline-flex items-center gap-1">
                    Asset <ChevronsUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="px-3">Shares</TableHead>
                <TableHead className="px-3">
                  <span className="inline-flex items-center gap-1">
                    Price <ChevronsUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="px-3">
                  <span className="inline-flex items-center gap-1">
                    Value <ChevronsUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="px-3">
                  <span className="inline-flex items-center gap-1">
                    Gain/Loss <ChevronsUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="px-3">Allocation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOLDINGS.map((holding) => {
                const cost = holding.value - holding.gain;
                const gainPct = (holding.gain / cost) * 100;
                const positive = holding.gain >= 0;
                const allocation = (holding.value / PORTFOLIO_VALUE) * 100;
                return (
                  <TableRow
                    key={holding.id}
                    className="h-16 border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/40"
                  >
                    <TableCell className="px-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid size-9 place-items-center rounded-lg text-[11px] font-semibold text-white/90"
                          style={{ backgroundColor: holding.color }}
                        >
                          {holding.symbol.slice(0, 2)}
                        </span>
                        <div>
                          <p className="font-medium leading-4">
                            {holding.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {holding.symbol} · {holding.category}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 tabular-nums text-muted-foreground">
                      {holding.shares}
                    </TableCell>
                    <TableCell className="px-3 tabular-nums">
                      {currency(holding.price, 2)}
                    </TableCell>
                    <TableCell className="px-3 font-medium tabular-nums">
                      {currency(holding.value)}
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="inline-flex items-center justify-end gap-2">
                        <span
                          className={`flex size-6 items-center justify-center rounded-full ${
                            positive
                              ? "bg-positive/10 text-positive"
                              : "bg-negative/10 text-negative"
                          }`}
                        >
                          <TrendingUp
                            className={`size-3.5 ${positive ? "" : "rotate-90"}`}
                          />
                        </span>
                        <div className="text-right leading-tight">
                          <p
                            className={`font-semibold tabular-nums ${positive ? "text-positive" : "text-negative"}`}
                          >
                            {positive ? "+" : ""}
                            {currency(holding.gain)}
                          </p>
                          <p
                            className={`text-xs tabular-nums ${positive ? "text-positive" : "text-negative"}`}
                          >
                            {positive ? "+" : ""}
                            {gainPct.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="inline-flex w-32 items-center justify-end gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${allocation}%` }}
                          />
                        </span>
                        <span className="w-10 tabular-nums text-muted-foreground">
                          {allocation.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DashboardSection>

      <UsageGuides steps={USAGE_GUIDE_STEPS} />
    </div>
  );
};
