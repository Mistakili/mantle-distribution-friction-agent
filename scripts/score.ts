#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAsset } from "../src/assets.js";
import { runScore } from "../src/run-score.js";
import { renderMarkdown } from "../src/report.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function parseAssetArg(): string {
  const idx = process.argv.indexOf("--asset");
  if (idx === -1 || !process.argv[idx + 1]) return "spcxx";
  return process.argv[idx + 1];
}

async function main() {
  const assetId = parseAssetArg();
  const asset = resolveAsset(assetId);

  console.log(`\n🔍 Mantle Distribution Friction Agent`);
  console.log(`   Asset: ${asset.symbol} (${asset.name})\n`);

  const report = await runScore(assetId);
  const { distributionHealth, complianceFriction } = report;
  console.log(`✓ Live data fetched`);

  const outDir = join(ROOT, "output");
  mkdirSync(outDir, { recursive: true });

  const jsonPath = join(outDir, `${asset.id}-report.json`);
  const mdPath = join(outDir, `${asset.id}-report.md`);

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, renderMarkdown(report));

  console.log(`\n📊 Distribution Health:  ${distributionHealth.score}/10 (${distributionHealth.label})`);
  console.log(`🚧 Compliance Friction: ${complianceFriction.score}/10 (${complianceFriction.label})`);
  console.log(`\n📝 Reports written:`);
  console.log(`   ${mdPath}`);
  console.log(`   ${jsonPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});