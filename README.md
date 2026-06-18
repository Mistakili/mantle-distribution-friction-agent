# Mantle Distribution Friction Agent

**Track 2 — Mantle Research Challenge** · Deadline July 3, 2026

Issuance is easy. **Distribution is the bottleneck** — especially compliance friction
(KYC, accreditation, jurisdiction) that limits who can actually hold tokenized assets.

This agent scores both sides:

| Score | Direction | Measures |
| --- | --- | --- |
| **Distribution Health** (1–10) | Higher = better | Liquidity velocity, Fluxion depth, Mantle RWA TVL |
| **Compliance Friction** (1–10) | Higher = worse | KYC, accreditation, jurisdiction gates |

Built by [@Mistakili](https://github.com/Mistakili) — extends the [Compliance Gate](https://github.com/Mistakili/Pharos-Agent-Arena) pattern to Mantle RWA research.

## Quick start

```bash
pnpm install
pnpm score --asset spcxx
```

Outputs:

- `output/spcxx-report.md` — submission-ready markdown
- `output/spcxx-report.json` — machine-readable scores

## Supported assets

```bash
pnpm score --asset spcxx      # SpaceX xStock (pre-IPO)
pnpm score --asset tslax      # Tesla xStock
pnpm score --asset syrupusdt  # Maple syrupUSDT (no CoinGecko — ecosystem only)
```

## What's inside

```
mantle-distribution-friction-agent/
├── SKILL.md                 # Mantle AI Agent Skills format
├── references/distribution.md
├── src/
│   ├── assets.ts            # Asset profiles + compliance rules
│   ├── compliance-friction.ts
│   ├── metrics.ts           # CoinGecko + DefiLlama fetchers
│   └── report.ts
├── scripts/score.ts         # CLI — run this for live reports
└── output/                  # Generated reports (gitignored)
```

## Data sources (live)

- **CoinGecko** — market cap, volume, FDV for xStocks
- **DefiLlama** — Mantle chain TVL, Fluxion, Aave, Ondo, RWA protocols

## Mantle Research Challenge submission

1. Post X thread with demo output + tag `@Mantle_Official`
2. Like/share [original Mantle post](https://x.com/Mantle_Official/status/2066880937271722093)
3. Join [Mantle Discord](https://discord.gg/jKYBBW5TZq)
4. Submit form: https://mantle.to/vwh

## Uniqueness

Most Track 2 entries will be generic "research RWAs" prompts. This agent:

- Scores **compliance friction** as a first-class distribution metric
- Pulls **live on-chain/market data** (not hand-wavy)
- Ships a **runnable CLI** + Mantle Agent Skills `SKILL.md`
- Ties to Mantle's exact narrative: distribution > issuance

## License

MIT