import type { AssetOption, DistributionReport } from "./types";

export async function fetchAssets(): Promise<AssetOption[]> {
  const res = await fetch("/api/assets");
  if (!res.ok) throw new Error("Failed to load assets");
  return res.json();
}

export async function fetchScore(assetId: string): Promise<DistributionReport> {
  const res = await fetch(`/api/score/${assetId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Score failed");
  return data;
}

export function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "n/a";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}