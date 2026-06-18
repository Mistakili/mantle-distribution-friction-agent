export interface MarketMetrics {
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  priceChange24hPct: number | null;
  volumeToMcap: number | null;
  imageUrl: string | null;
  source: string;
  fetchedAt: string;
}

export interface MantleEcosystemMetrics {
  chainTvlUsd: number;
  rwaTvlUsd: number;
  fluxionTvlUsd: number;
  aaveMantleTvlUsd: number;
  ondoMantleTvlUsd: number;
  source: string;
  fetchedAt: string;
}

export interface DistributionHealthResult {
  score: number;
  label: "weak" | "moderate" | "strong";
  components: {
    name: string;
    score: number;
    weight: number;
    detail: string;
  }[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "mantle-distribution-friction-agent/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

export async function fetchMarketMetrics(coingeckoId: string): Promise<MarketMetrics> {
  const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`;
  const data = await fetchJson<{
    image?: { large?: string; small?: string };
    market_data: {
      market_cap: { usd: number | null };
      total_volume: { usd: number | null };
      fully_diluted_valuation: { usd: number | null };
      price_change_percentage_24h: number | null;
    };
  }>(url);

  const mcap = data.market_data.market_cap.usd;
  const vol = data.market_data.total_volume.usd;
  const volumeToMcap = mcap && vol && mcap > 0 ? vol / mcap : null;

  return {
    marketCapUsd: mcap,
    volume24hUsd: vol,
    fdvUsd: data.market_data.fully_diluted_valuation.usd,
    priceChange24hPct: data.market_data.price_change_percentage_24h,
    volumeToMcap,
    imageUrl: data.image?.large ?? data.image?.small ?? null,
    source: "CoinGecko",
    fetchedAt: new Date().toISOString(),
  };
}

type DefiLlamaProtocol = {
  name: string;
  category?: string;
  chainTvls?: Record<string, number>;
};

export async function fetchMantleEcosystemMetrics(): Promise<MantleEcosystemMetrics> {
  const [chains, protocols] = await Promise.all([
    fetchJson<{ name: string; tvl: number }[]>("https://api.llama.fi/v2/chains"),
    fetchJson<DefiLlamaProtocol[]>("https://api.llama.fi/protocols"),
  ]);

  const mantle = chains.find((c) => c.name === "Mantle");
  const chainTvlUsd = mantle?.tvl ?? 0;

  const mantleProtocols = protocols.filter((p) => p.chainTvls?.Mantle != null);

  const sumCategory = (predicate: (p: DefiLlamaProtocol) => boolean) =>
    mantleProtocols
      .filter(predicate)
      .reduce((sum, p) => sum + (p.chainTvls?.Mantle ?? 0), 0);

  const rwaTvlUsd = sumCategory(
    (p) => p.category === "RWA" || /ondo|maple|solv|index four/i.test(p.name),
  );

  const fluxion = mantleProtocols.find((p) => /fluxion/i.test(p.name));
  const aave = mantleProtocols.find((p) => /aave v3/i.test(p.name));
  const ondo = mantleProtocols.find((p) => /ondo yield/i.test(p.name));

  return {
    chainTvlUsd,
    rwaTvlUsd,
    fluxionTvlUsd: fluxion?.chainTvls?.Mantle ?? 0,
    aaveMantleTvlUsd: aave?.chainTvls?.Mantle ?? 0,
    ondoMantleTvlUsd: ondo?.chainTvls?.Mantle ?? 0,
    source: "DefiLlama",
    fetchedAt: new Date().toISOString(),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function scoreDistributionHealth(
  market: MarketMetrics | null,
  ecosystem: MantleEcosystemMetrics,
): DistributionHealthResult {
  const components: DistributionHealthResult["components"] = [];

  if (market?.volumeToMcap != null) {
    const velocity = clamp(market.volumeToMcap * 4, 0, 10);
    components.push({
      name: "liquidity_velocity",
      score: Math.round(velocity * 10) / 10,
      weight: 0.35,
      detail: `24h volume / market cap = ${(market.volumeToMcap * 100).toFixed(1)}% (${market.volume24hUsd?.toLocaleString()} / ${market.marketCapUsd?.toLocaleString()} USD)`,
    });
  } else {
    components.push({
      name: "liquidity_velocity",
      score: 5,
      weight: 0.35,
      detail: "No live market data — using neutral estimate",
    });
  }

  const fluxionScore = clamp((ecosystem.fluxionTvlUsd / 500_000) * 3, 0, 10);
  components.push({
    name: "venue_depth",
    score: Math.round(fluxionScore * 10) / 10,
    weight: 0.25,
    detail: `Fluxion DEX TVL on Mantle: $${Math.round(ecosystem.fluxionTvlUsd).toLocaleString()}`,
  });

  const rwaShare = ecosystem.chainTvlUsd > 0 ? ecosystem.rwaTvlUsd / ecosystem.chainTvlUsd : 0;
  const ecosystemScore = clamp(rwaShare * 20 + 3, 0, 10);
  components.push({
    name: "ecosystem_rwa_depth",
    score: Math.round(ecosystemScore * 10) / 10,
    weight: 0.25,
    detail: `Mantle RWA TVL ~$${Math.round(ecosystem.rwaTvlUsd).toLocaleString()} (${(rwaShare * 100).toFixed(1)}% of chain TVL)`,
  });

  const infraScore = clamp((ecosystem.aaveMantleTvlUsd / 50_000_000) * 10, 3, 10);
  components.push({
    name: "defi_rail_access",
    score: Math.round(infraScore * 10) / 10,
    weight: 0.15,
    detail: `Aave Mantle TVL $${Math.round(ecosystem.aaveMantleTvlUsd).toLocaleString()} — composability rail for capital`,
  });

  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const score =
    Math.round(
      (components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight) * 10,
    ) / 10;

  const label = score >= 7 ? "strong" : score >= 4.5 ? "moderate" : "weak";

  return { score, label, components };
}