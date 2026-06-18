import { resolveAsset } from "./assets.js";
import { scoreComplianceFriction } from "./compliance-friction.js";
import {
  fetchMarketMetrics,
  fetchMantleEcosystemMetrics,
  scoreDistributionHealth,
} from "./metrics.js";
import { buildReport, type DistributionReport } from "./report.js";

export async function runScore(assetId: string): Promise<DistributionReport> {
  const base = resolveAsset(assetId);
  const ecosystem = await fetchMantleEcosystemMetrics();

  let market = null;
  if (base.coingeckoId) {
    try {
      market = await fetchMarketMetrics(base.coingeckoId);
    } catch {
      market = null;
    }
  }

  const asset = {
    ...base,
    imageUrl: market?.imageUrl ?? base.imageUrl,
  };

  const distributionHealth = scoreDistributionHealth(market, ecosystem);
  const complianceFriction = scoreComplianceFriction(asset);

  return buildReport({
    asset,
    distributionHealth,
    complianceFriction,
    market,
    ecosystem,
  });
}