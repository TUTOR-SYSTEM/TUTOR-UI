"use client";

import { notFound } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { useApiGapsCopy } from "@/hooks/useApiGapsCopy.hook";
import gapReport from "@/lib/api-gaps/gap-report.json";

type Status = "OK" | "MISSING" | "MISMATCH" | "MOCK" | "UNVERIFIED";
const STATUSES: Status[] = ["MISSING", "MISMATCH", "MOCK", "UNVERIFIED", "OK"];

type UiRequest = {
  method: string;
  path: string;
  file: string;
  line: number;
  status: Status;
  backend: string;
  note: string;
};
type PageEntry = { page: string; file: string; requests: UiRequest[] };
type UnusedBackend = { method: string; path: string; module: string };

const pages = gapReport.pages as PageEntry[];
const unusedBackend = gapReport.unusedBackend as UnusedBackend[];

const STATUS_STYLE: Record<Status, string> = {
  OK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  MISSING: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  MISMATCH: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  MOCK: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  UNVERIFIED: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export default function ApiGapsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const copy = useApiGapsCopy();
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<Status, number> = { OK: 0, MISSING: 0, MISMATCH: 0, MOCK: 0, UNVERIFIED: 0 };
    for (const p of pages) for (const r of p.requests) c[r.status] += 1;
    return c;
  }, []);
  const total = pages.reduce((n, p) => n + p.requests.length, 0);

  const visiblePages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank = (p: PageEntry) =>
      p.requests.some((r) => r.status === "MISSING") ? 0 : p.requests.some((r) => r.status === "MISMATCH" || r.status === "MOCK") ? 1 : 2;
    return pages
      .map((p) => ({
        ...p,
        requests: p.requests.filter(
          (r) =>
            (filter === "ALL" || r.status === filter) &&
            (!q || `${r.method} ${r.path} ${r.file} ${r.backend} ${r.note}`.toLowerCase().includes(q)),
        ),
      }))
      .filter((p) => p.requests.length > 0)
      .sort((a, b) => rank(a) - rank(b));
  }, [filter, query]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{copy.heading}</h1>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </header>

      <section className="flex flex-wrap gap-2">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
        >
          {copy.all} ({total})
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {copy.statusLabels[s]} ({counts[s]})
          </Button>
        ))}
      </section>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={copy.searchPlaceholder}
      />

      <section className="space-y-4">
        {visiblePages.map((p) => {
          const missing = p.requests.filter((r) => r.status === "MISSING").length;
          return (
            <article key={p.page} className="rounded-lg border">
              <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                <code className="font-semibold">{p.page}</code>
                <span className="text-xs text-muted-foreground">{p.file}</span>
                {missing > 0 && (
                  <span className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE.MISSING}`}>
                    {copy.missingCount(missing)}
                  </span>
                )}
              </header>
              <ul className="divide-y">
                {p.requests.map((r, i) => (
                  <li key={`${p.page}-${i}`} className="space-y-1 px-4 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                        {copy.statusLabels[r.status]}
                      </span>
                      <code className="font-mono">
                        {r.method} {r.path}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {r.file}:{r.line}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {copy.backendLabel}: <span className="font-mono">{r.backend}</span>
                    </div>
                    {r.note && <div className="text-xs">{r.note}</div>}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
        {visiblePages.length === 0 && (
          <p className="text-sm text-muted-foreground">{copy.noMatch}</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{copy.unusedHeading(unusedBackend.length)}</h2>
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {unusedBackend.map((u, i) => (
            <li key={`${u.module}-${u.method}-${u.path}-${i}`} className="rounded border px-2 py-1 font-mono">
              <span className="text-muted-foreground">[{u.module}]</span> {u.method} {u.path}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
