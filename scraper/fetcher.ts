import type { APIRequestContext } from "playwright";
import { USER_AGENT } from "./auth";

export type FetchStats = { total: number; failures: number };

export async function fetchPage(
  request: APIRequestContext,
  url: string,
): Promise<string> {
  const response = await request.get(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok()) {
    throw new Error(`HTTP ${response.status()} for ${url}`);
  }
  return response.text();
}

export async function fetchAndParse<T>(
  request: APIRequestContext,
  url: string,
  parser: (html: string) => T[],
  label: string,
  stats: FetchStats,
): Promise<T[]> {
  stats.total++;
  try {
    const html = await fetchPage(request, url);
    return parser(html);
  } catch (err) {
    stats.failures++;
    console.warn(`  ⚠ ${label}: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}
