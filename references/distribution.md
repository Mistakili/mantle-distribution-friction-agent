# Distribution Friction Reference

## Data sources

| Source | Endpoint | Used for |
| --- | --- | --- |
| CoinGecko | `/api/v3/coins/{id}` | Market cap, 24h volume, FDV |
| DefiLlama | `/v2/chains` | Mantle chain TVL |
| DefiLlama | `/protocols` | RWA, Fluxion, Aave, Ondo TVL on Mantle |

Run via: `pnpm score --asset <id>`

---

## Distribution Health Score (1–10)

Higher = capital is distributing; liquidity and infrastructure support flow.

| Component | Weight | Logic |
| --- | --- | --- |
| `liquidity_velocity` | 35% | `24h_volume / market_cap` — trading activity vs outstanding value |
| `venue_depth` | 25% | Fluxion DEX TVL on Mantle — native trading venue depth |
| `ecosystem_rwa_depth` | 25% | RWA TVL share of Mantle chain TVL |
| `defi_rail_access` | 15% | Aave Mantle TVL — composability for institutional capital |

**Labels:** ≥7 strong · ≥4.5 moderate · <4.5 weak

---

## Compliance Friction Model

Higher = **more friction** blocking global distribution (worse).

Inspired by [Compliance Gate](https://github.com/Mistakili/Pharos-Agent-Arena) policy checks:

| Check | Friction weight | When applied |
| --- | --- | --- |
| KYC required | +2.0 | All Mantle xStocks / institutional products |
| Accreditation required | +3.0 | Pre-IPO equity (SPCXx) |
| Blocked jurisdictions | +0.4 each (max 2.5) | Sanctioned / restricted regions |
| Asset class baseline | +1.5 to +2.5 | Structural securities-law limits |
| Age gate (18+) | +0.5 | Standard onboarding friction |

**Labels:** ≥8 severe · ≥6 high · ≥4 moderate · <4 low

### Why this matters for distribution

Token minting is permissionless. **Buyer onboarding is not.** An agent or user
in a non-qualified jurisdiction cannot receive pre-IPO equity even if the token
exists on Mantle. That gap between issuance and qualified holders IS the
distribution bottleneck Mantle's challenge describes.

---

## Output format

```markdown
## Executive Summary
[distribution health score] [compliance friction score] [thesis]

## Key Metrics
[market table] [ecosystem table]

## Distribution Health Breakdown
[component scores]

## Compliance Friction Breakdown
[gate checks]

## Main Bottlenecks
[numbered list]

## Mantle Leverage Opportunities
[xStocks, Fluxion, InsightX, Agent Skills, Aave]

## Actionable Next Steps
[90-day recommendations]
```

---

## Example prompts

- "Score SPCXx distribution on Mantle"
- "Why is tokenized SpaceX not reaching global buyers?"
- "Compare distribution health vs compliance friction for TSLAx"
- "What should Mantle do to improve RWA distribution in 90 days?"