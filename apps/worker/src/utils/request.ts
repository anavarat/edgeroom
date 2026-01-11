export function parseLimit(raw: string | undefined, def = 200, min = 1, max = 500) {
  if (!raw) return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}

export function parseOffset(raw: string | undefined, def = 0, min = 0) {
  if (!raw) return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.max(n, min);
}
