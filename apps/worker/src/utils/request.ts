// edgeroom/apps/worker/src/utils/request.ts
export function parseLimit(raw: string | undefined, def = 200, min = 1, max = 500) {
  if (!raw) return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}
