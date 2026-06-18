import type { AssetOption, DistributionReport } from "./types";

export const FETCH_TIMEOUT_MS = 15_000;
export const SLOW_HINT_MS = 4_000;

export class FetchTimeoutError extends Error {
  constructor(message = "Request timed out — data APIs may be slow. Try again.") {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

async function fetchJson<T>(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    return data as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new FetchTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAssets(): Promise<AssetOption[]> {
  return fetchJson<AssetOption[]>("/api/assets", 8_000);
}

export async function fetchScore(assetId: string): Promise<DistributionReport> {
  return fetchJson<DistributionReport>(`/api/score/${assetId}`);
}

export function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "n/a";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export interface AssetScorePreview {
  health: number;
  friction: number;
  fetchedAt: string;
}