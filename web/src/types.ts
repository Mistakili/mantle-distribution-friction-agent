export interface DistributionReport {
  asset: {
    id: string;
    symbol: string;
    name: string;
    assetClass: string;
    distributionChannel: string;
  };
  generatedAt: string;
  distributionHealth: {
    score: number;
    label: string;
    components: { name: string; score: number; weight: number; detail: string }[];
  };
  complianceFriction: {
    score: number;
    label: string;
    drivers: string[];
    gateChecks: { name: string; friction: number; detail: string }[];
  };
  market: {
    marketCapUsd: number | null;
    volume24hUsd: number | null;
    fdvUsd: number | null;
    priceChange24hPct: number | null;
    volumeToMcap: number | null;
    source: string;
  } | null;
  ecosystem: {
    chainTvlUsd: number;
    rwaTvlUsd: number;
    fluxionTvlUsd: number;
    aaveMantleTvlUsd: number;
    ondoMantleTvlUsd: number;
    source: string;
  };
  bottlenecks: string[];
  mantleLevers: string[];
  nextSteps: string[];
}

export interface AssetOption {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  channel: string;
}