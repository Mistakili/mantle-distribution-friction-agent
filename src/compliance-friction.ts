import type { AssetProfile } from "./assets.js";

export interface ComplianceFrictionResult {
  score: number;
  label: "low" | "moderate" | "high" | "severe";
  drivers: string[];
  gateChecks: { name: string; friction: number; detail: string }[];
}

/**
 * Compliance friction model — inspired by Compliance Gate policy checks.
 * Higher score = more friction blocking global distribution (worse).
 */
export function scoreComplianceFriction(asset: AssetProfile): ComplianceFrictionResult {
  const checks: { name: string; friction: number; detail: string }[] = [];

  if (asset.compliance.requireKyc) {
    checks.push({
      name: "kyc",
      friction: 2,
      detail: "KYC onboarding required before holders can receive or trade",
    });
  }

  if (asset.compliance.requireAccreditation) {
    checks.push({
      name: "accreditation",
      friction: 3,
      detail: "Accredited / qualified investor gate shrinks addressable market",
    });
  }

  const blocked = asset.compliance.blockedJurisdictions.length;
  checks.push({
    name: "jurisdiction",
    friction: Math.min(2.5, 0.4 * blocked),
    detail: `${blocked} blocked jurisdictions (${asset.compliance.blockedJurisdictions.join(", ")})`,
  });

  const classFriction: Record<AssetProfile["assetClass"], number> = {
    tokenized_pre_ipo_equity: 2.5,
    tokenized_public_equity: 1.5,
    institutional_yield: 1.8,
  };
  checks.push({
    name: "asset_class",
    friction: classFriction[asset.assetClass],
    detail: `${asset.assetClass.replace(/_/g, " ")} carries structural distribution limits`,
  });

  if (asset.compliance.minAge >= 18) {
    checks.push({
      name: "age",
      friction: 0.5,
      detail: `Minimum age ${asset.compliance.minAge} — standard but adds onboarding step`,
    });
  }

  const raw = checks.reduce((sum, c) => sum + c.friction, 0);
  const score = Math.min(10, Math.round(raw * 10) / 10);

  const label =
    score >= 8 ? "severe" : score >= 6 ? "high" : score >= 4 ? "moderate" : "low";

  const drivers = [
    ...asset.compliance.notes,
    asset.compliance.requireAccreditation
      ? "Accreditation is the primary bottleneck — issuance is easy, qualified buyer pool is not"
      : "KYC + venue rules are the primary bottleneck — not token minting",
  ];

  return { score, label, drivers, gateChecks: checks };
}