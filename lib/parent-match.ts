/** Lowercase, strip Vietnamese diacritics and collapse spaces: "Nguyễn  Văn" → "nguyen van". */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** "exact" = same name, "contains" = query is inside the name, "similar" = typo/prefix on a word. */
export type ParentMatch = "exact" | "contains" | "similar";

export function matchParentName(name: string, query: string): ParentMatch | null {
  const target = normalizeText(name);
  const q = normalizeText(query);
  if (!q) return null;
  if (target === q) return "exact";
  if (target.includes(q)) return "contains";

  const words = target.split(" ");
  const hit = q.split(" ").some((qw) =>
    words.some(
      (w) =>
        (qw.length >= 2 && w.startsWith(qw)) ||
        (qw.length >= 3 && levenshtein(w, qw) <= 1),
    ),
  );
  return hit ? "similar" : null;
}

/** Longest word of the raw query (kept with its diacritics so the server search can match it). */
export function longestWord(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((best, w) => (normalizeText(w).length > normalizeText(best).length ? w : best), "");
}
