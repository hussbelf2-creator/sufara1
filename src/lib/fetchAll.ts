/* PostgREST answers a plain select with at most 1000 rows, which is not enough
   once the whole site's copy lives in one table. This walks the result set in
   pages so nothing is dropped — the content panel and the live site agree on
   every line. */

type PageResult = { data: unknown; error: { message?: string } | null };

export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<PageResult>,
  pageSize = 1000,
): Promise<{ rows: T[]; error: string }> {
  const rows: T[] = [];
  const limit = 50_000;
  for (let from = 0; from < limit; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { rows, error: error.message ?? 'query failed' };
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return { rows, error: '' };
}