import { useCallback, useEffect, useState, type ReactNode } from "react";
import { fetchAssets, fetchScore, fmtUsd } from "./api";
import type { AssetOption, DistributionReport } from "./types";

function ScoreRing({
  score,
  max = 10,
  color,
  label,
  sublabel,
}: {
  score: number;
  max?: number;
  color: string;
  label: string;
  sublabel: string;
}) {
  const pct = (score / max) * 100;
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white">{score}</span>
          <span className="text-xs text-zinc-500">/ {max}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-zinc-500 capitalize">{sublabel}</div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-zinc-800/60 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-mono text-zinc-200">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-5">
      <h3 className="text-sm font-mono text-zinc-500 tracking-wider uppercase mb-4">{title}</h3>
      {children}
    </div>
  );
}

const ASSET_ICONS: Record<string, string> = {
  spcxx: "🚀",
  tslax: "⚡",
  syrupusdt: "🏦",
};

export default function App() {
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [selected, setSelected] = useState("spcxx");
  const [report, setReport] = useState<DistributionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (assetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScore(assetId);
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets()
      .then(setAssets)
      .catch(() =>
        setAssets([
          { id: "spcxx", symbol: "SPCXx", name: "SpaceX xStock", assetClass: "tokenized_pre_ipo_equity", channel: "Fluxion + Bybit" },
          { id: "tslax", symbol: "TSLAx", name: "Tesla xStock", assetClass: "tokenized_public_equity", channel: "Fluxion + Bybit" },
          { id: "syrupusdt", symbol: "syrupUSDT", name: "Maple syrupUSDT", assetClass: "institutional_yield", channel: "Aave on Mantle" },
        ]),
      );
  }, []);

  useEffect(() => {
    analyze(selected);
  }, [selected, analyze]);

  const health = report?.distributionHealth;
  const friction = report?.complianceFriction;

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              M
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">
                Distribution Friction Agent
              </div>
              <div className="text-xs text-zinc-500">Mantle Research Challenge · Track 2</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live data · CoinGecko + DefiLlama
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Where does distribution break?
          </h1>
          <p className="text-zinc-400 max-w-2xl text-lg leading-relaxed">
            Issuance is solved. Score <span className="text-emerald-400">liquidity health</span> and{" "}
            <span className="text-amber-400">compliance friction</span> for Mantle RWAs — live.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {assets.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                selected === a.id
                  ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <span className="mr-1.5">{ASSET_ICONS[a.id] ?? "📊"}</span>
              {a.symbol}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && !report && (
          <div className="flex items-center justify-center py-24 text-zinc-500">
            <span className="animate-pulse font-mono text-sm">Fetching live metrics…</span>
          </div>
        )}

        {report && (
          <>
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-zinc-500 mb-1">ANALYZING</div>
                  <h2 className="text-2xl font-bold text-white mb-1">{report.asset.name}</h2>
                  <p className="text-sm text-zinc-500 mb-4">{report.asset.distributionChannel}</p>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-200">Thesis:</strong> Issuance is solved. Distribution
                    fails at compliance + venue + discovery — not at token minting.
                    {health && friction && (
                      <span className="block mt-2 text-zinc-300">
                        {health.score >= 7 && friction.score >= 7
                          ? "⚡ High trading activity, but severe compliance gates limit who can hold."
                          : friction.score >= 7
                            ? "🚧 Compliance friction is the primary distribution bottleneck."
                            : "📈 Distribution infrastructure is the main growth lever."}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-8 sm:gap-12 shrink-0">
                  {health && (
                    <ScoreRing
                      score={health.score}
                      color="#10b981"
                      label="Distribution Health"
                      sublabel={`${health.label} · higher is better`}
                    />
                  )}
                  {friction && (
                    <ScoreRing
                      score={friction.score}
                      color="#f59e0b"
                      label="Compliance Friction"
                      sublabel={`${friction.label} · higher = more blocked`}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Asset market">
                {report.market ? (
                  <>
                    <MetricRow label="Market cap" value={fmtUsd(report.market.marketCapUsd)} />
                    <MetricRow label="24h volume" value={fmtUsd(report.market.volume24hUsd)} />
                    <MetricRow label="FDV" value={fmtUsd(report.market.fdvUsd)} />
                    <MetricRow
                      label="Vol / MCap"
                      value={
                        report.market.volumeToMcap != null
                          ? `${(report.market.volumeToMcap * 100).toFixed(1)}%`
                          : "n/a"
                      }
                    />
                    <MetricRow
                      label="24h change"
                      value={
                        report.market.priceChange24hPct != null
                          ? `${report.market.priceChange24hPct.toFixed(2)}%`
                          : "n/a"
                      }
                    />
                    <div className="text-[10px] text-zinc-600 mt-3 font-mono">
                      source: {report.market.source}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">No live market data — ecosystem scores only.</p>
                )}
              </Section>

              <Section title="Mantle ecosystem">
                <MetricRow label="Chain TVL" value={fmtUsd(report.ecosystem.chainTvlUsd)} />
                <MetricRow label="RWA TVL (est.)" value={fmtUsd(report.ecosystem.rwaTvlUsd)} />
                <MetricRow label="Fluxion DEX" value={fmtUsd(report.ecosystem.fluxionTvlUsd)} />
                <MetricRow label="Aave Mantle" value={fmtUsd(report.ecosystem.aaveMantleTvlUsd)} />
                <MetricRow label="Ondo Mantle" value={fmtUsd(report.ecosystem.ondoMantleTvlUsd)} />
                <div className="text-[10px] text-zinc-600 mt-3 font-mono">
                  source: {report.ecosystem.source}
                </div>
              </Section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {health && (
                <Section title="Distribution health breakdown">
                  <div className="space-y-3">
                    {health.components.map((c) => (
                      <div key={c.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400 font-mono">{c.name}</span>
                          <span className="text-emerald-400 font-mono">{c.score}/10</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(c.score / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1">{c.detail}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {friction && (
                <Section title="Compliance friction breakdown">
                  <div className="space-y-2">
                    {friction.gateChecks.map((c) => (
                      <div
                        key={c.name}
                        className="flex gap-3 text-sm py-1.5 border-b border-zinc-800/40 last:border-0"
                      >
                        <span className="text-amber-500 font-mono shrink-0 w-8">+{c.friction}</span>
                        <div>
                          <span className="text-zinc-300 font-medium capitalize">
                            {c.name.replace(/_/g, " ")}
                          </span>
                          <p className="text-xs text-zinc-500">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Section title="Bottlenecks">
                <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
                  {report.bottlenecks.map((b, i) => (
                    <li key={i} className="leading-relaxed">
                      {b}
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="Mantle levers">
                <ul className="space-y-2 text-sm text-zinc-400">
                  {report.mantleLevers.map((l, i) => (
                    <li key={i} className="flex gap-2 leading-relaxed">
                      <span className="text-emerald-600 shrink-0">→</span>
                      {l}
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Next 90 days">
                <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
                  {report.nextSteps.map((s, i) => (
                    <li key={i} className="leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ol>
              </Section>
            </div>

            <div className="text-center text-xs text-zinc-600 font-mono pt-4">
              Generated {new Date(report.generatedAt).toLocaleString()} ·{" "}
              <a
                href="https://github.com/Mistakili/mantle-distribution-friction-agent"
                className="text-emerald-600 hover:text-emerald-400 underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                Source on GitHub
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}