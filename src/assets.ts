export type AssetClass =
  | "tokenized_pre_ipo_equity"
  | "tokenized_public_equity"
  | "institutional_yield";

export interface AssetProfile {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  coingeckoId?: string;
  /** Local or remote token logo — overridden by live CoinGecko image when available. */
  imageUrl: string;
  issuerImageUrl: string;
  issuer: string;
  distributionChannel: string;
  compliance: {
    requireKyc: boolean;
    requireAccreditation: boolean;
    blockedJurisdictions: string[];
    allowedJurisdictions?: string[];
    minAge: number;
    notes: string[];
  };
}

export const ASSETS: Record<string, AssetProfile> = {
  spcxx: {
    id: "spcxx",
    symbol: "SPCXx",
    name: "SpaceX xStock (tokenized pre-IPO equity)",
    assetClass: "tokenized_pre_ipo_equity",
    coingeckoId: "spacex-xstocks",
    imageUrl: "/assets/spcxx.png",
    issuerImageUrl: "/assets/xstocks.png",
    issuer: "xStocksFi",
    distributionChannel: "Fluxion Network + Bybit (xStocks execution)",
    compliance: {
      requireKyc: true,
      requireAccreditation: true,
      blockedJurisdictions: ["KP", "IR", "RU", "SY"],
      minAge: 18,
      notes: [
        "Pre-IPO equity is typically restricted to accredited / qualified investors",
        "Cross-border distribution requires jurisdiction-specific onboarding",
        "Tokenized wrapper does not remove off-chain securities compliance",
      ],
    },
  },
  tslax: {
    id: "tslax",
    symbol: "TSLAx",
    name: "Tesla xStock (tokenized public equity)",
    assetClass: "tokenized_public_equity",
    coingeckoId: "tesla-xstock",
    imageUrl: "/assets/tslax.png",
    issuerImageUrl: "/assets/xstocks.png",
    issuer: "xStocksFi",
    distributionChannel: "Fluxion Network + Bybit",
    compliance: {
      requireKyc: true,
      requireAccreditation: false,
      blockedJurisdictions: ["KP", "IR"],
      minAge: 18,
      notes: [
        "Public equity tokens still require KYC at the venue layer",
        "Broker/dealer rules vary by user jurisdiction",
      ],
    },
  },
  syrupusdt: {
    id: "syrupusdt",
    symbol: "syrupUSDT",
    name: "Maple syrupUSDT (institutional lending yield)",
    assetClass: "institutional_yield",
    imageUrl: "/assets/syrupusdt.png",
    issuerImageUrl: "/assets/maple.jpg",
    issuer: "Maple Finance",
    distributionChannel: "Aave on Mantle",
    compliance: {
      requireKyc: true,
      requireAccreditation: false,
      blockedJurisdictions: ["KP", "IR", "RU", "SY"],
      minAge: 18,
      notes: [
        "Institutional yield products gate access at the protocol/custody layer",
        "Distribution limited to wallets that pass Maple/Aave allowlists",
      ],
    },
  },
};

export function resolveAsset(id: string): AssetProfile {
  const key = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  const asset = ASSETS[key];
  if (!asset) {
    const available = Object.keys(ASSETS).join(", ");
    throw new Error(`Unknown asset "${id}". Available: ${available}`);
  }
  return asset;
}