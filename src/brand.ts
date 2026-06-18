/** Static brand assets served from web/public (or remote fallbacks). */
export const BRAND = {
  mantle: "/assets/mantle.png",
  aave: "/assets/aave.png",
  maple: "/assets/maple.jpg",
  usdt: "/assets/usdt.png",
  xstocks: "/assets/xstocks.png",
} as const;

export const ISSUER_IMAGES: Record<string, string> = {
  xStocksFi: BRAND.xstocks,
  "Maple Finance": BRAND.maple,
};