import { resolveAsset } from "./assets.js";
import { scoreComplianceFriction } from "./compliance-friction.js";
import {
  fetchMarketMetrics,
  fetchMantleEcosystemMetrics,
  scoreDistributionHealth,
} from "./metrics.js";
import { buildReport, type DistributionReport } from "./report.js";

export async function runScore(assetId: string): Promise<DistributionReport> {
  const asset = resolveAsset(assetId);
  const ecosystem = await fetchMantleEcosystemMetrics();

  let market = null;
  if (asset.coingeckoId) {
    try {
      market = await fetchMarketMetrics(asset.coingeckoId);
    } catch {
      market = null;
    }
  }

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