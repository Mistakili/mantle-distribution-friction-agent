import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  fetchAssets,
  fetchScore,
  FetchTimeoutError,
  fmtUsd,
  SLOW_HINT_MS,
  type AssetScorePreview,
} from "./api";
import type { AssetOption, DistributionReport } from "./types";

type LoadPhase = "idle" | "loading" | "slow" | "done" | "error";

function ScoreRing({
  score,
  max = 10,
  polarity,
  label,
  sublabel,
}: {
  score: number;
  max?: number;
  polarity: "positive" | "negative";
  label: string;
  sublabel: string;
}) {
  const isPositive = polarity === "positive";
  const color = isPositive ? "#10b981" : "#ef4444";
  const pct = (score / max) * 100;
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <div
          className={`absolute -top-1 -right-1 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs border ${
            isPositive
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
              : "bg-red-500/20 border-red-500/40 text-red-400"
          }`}
          title={isPositive ? "Higher is better" : "Higher means more blocked"}
        >
          {isPositive ? "↑" : "⛔"}
        </div>
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
          <span className={`text-3xl font-extrabold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {score}
          </span>
          <span className="text-xs text-zinc-500">/ {max}</span>
        </div>
      </div>
      <div className="text-center max-w-[9rem]">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div
          className={`text-[11px] mt-0.5 font-medium ${isPositive ? "text-emerald-500/80" : "text-red-400/90"}`}
        >
          {isPositive ? "↑ higher is better" : "⛔ higher = more blocked"}
        </div>
        <div className="text-xs text-zinc-500 capitalize mt-0.5">{sublabel}</div>
      </div>
    </div>
  );
}

function ScoreLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs font-mono">
      <span className="flex items-center gap-1.5 text-emerald-500/90">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Health ↑ better
      </span>
      <span className="flex items-center gap-1.5 text-red-400/90">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Friction ⛔ higher = blocked
      </span>
    </div>
  );
}

function ScoreBadge({
  value,
  kind,
  loading,
}: {
  value?: number;
  kind: "health" | "friction";
  loading?: boolean;
}) {
  if (loading) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-600 animate-pulse">
        …
      </span>
    );
  }
  if (value == null) return null;

  const isHealth = kind === "health";
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
        isHealth
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-red-500/10 border-red-500/30 text-red-400"
      }`}
      title={isHealth ? "Distribution health" : "Compliance friction"}
    >
      {isHealth ? "H" : "F"} {value.toFixed(1)}
    </span>
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

const FALLBACK_ASSETS: AssetOption[] = [
  { id: "spcxx", symbol: "SPCXx", name: "SpaceX xStock", assetClass: "tokenized_pre_ipo_equity", channel: "Fluxion + Bybit" },
  { id: "tslax", symbol: "TSLAx", name: "Tesla xStock", assetClass: "tokenized_public_equity", channel: "Fluxion + Bybit" },
  { id: "syrupusdt", symbol: "syrupUSDT", name: "Maple syrupUSDT", assetClass: "institutional_yield", channel: "Aave on Mantle" },
];

export default function App() {
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [selected, setSelected] = useState("spcxx");
  const [report, setReport] = useState<DistributionReport | null>(null);
  const [loadPhase, setLoadPhase] = useState<LoadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [previews, setPreviews] = useState<Record<string, AssetScorePreview | "loading" | "error">>({});

  const cacheRef = useRef<Record<string, DistributionReport>>({});
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSlowTimer = () => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  };

  const prefetchAsset = useCallback(async (assetId: string) => {
    setPreviews((p) => ({ ...p, [assetId]: "loading" }));
    try {
      const data = await fetchScore(assetId);
      cacheRef.current[assetId] = data;
      setPreviews((p) => ({
        ...p,
        [assetId]: {
          health: data.distributionHealth.score,
          friction: data.complianceFriction.score,
          fetchedAt: data.generatedAt,
        },
      }));
      return data;
    } catch {
      setPreviews((p) => ({ ...p, [assetId]: "error" }));
      return null;
    }
  }, []);

  const analyze = useCallback(
    async (assetId: string, opts?: { force?: boolean }) => {
      clearSlowTimer();
      setError(null);
      setStale(false);

      const cached = cacheRef.current[assetId];
      if (cached && !opts?.force) {
        setReport(cached);
        setLoadPhase("done");
      } else {
        setLoadPhase("loading");
      }

      slowTimerRef.current = setTimeout(() => {
        setLoadPhase((phase) => (phase === "loading" ? "slow" : phase));
      }, SLOW_HINT_MS);

      try {
        const data = await fetchScore(assetId);
        clearSlowTimer();
        cacheRef.current[assetId] = data;
        setReport(data);
        setLoadPhase("done");
        setPreviews((p) => ({
          ...p,
          [assetId]: {
            health: data.distributionHealth.score,
            friction: data.complianceFriction.score,
            fetchedAt: data.generatedAt,
          },
        }));
      } catch (e) {
        clearSlowTimer();
        const msg =
          e instanceof FetchTimeoutError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Analysis failed";

        if (cached) {
          setReport(cached);
          setStale(true);
          setLoadPhase("done");
          setError(`${msg} Showing last cached result.`);
        } else {
          setError(msg);
          setLoadPhase("error");
          if (!cached) setReport(null);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchAssets()
      .then(setAssets)
      .catch(() => setAssets(FALLBACK_ASSETS));
  }, []);

  useEffect(() => {
    const list = assets.length ? assets : FALLBACK_ASSETS;
    list.forEach((a) => prefetchAsset(a.id));
  }, [assets, prefetchAsset]);

  useEffect(() => {
    analyze(selected);
    return clearSlowTimer;
  }, [selected, analyze]);

  const health = report?.distributionHealth;
  const friction = report?.complianceFriction;
  const assetList = assets.length ? assets : FALLBACK_ASSETS;
  const isRefreshing = loadPhase === "loading" || loadPhase === "slow";

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
          <p className="text-zinc-400 max-w-2xl text-lg leading-relaxed mb-3">
            Issuance is solved. Score <span className="text-emerald-400">liquidity health</span> and{" "}
            <span className="text-red-400">compliance friction</span> for Mantle RWAs — live.
          </p>
          <ScoreLegend />
        </div>

        <div className="flex flex-wrap gap-2">
          {assetList.map((a) => {
            const preview = previews[a.id];
            const previewData = preview && preview !== "loading" && preview !== "error" ? preview : null;
            const previewLoading = preview === "loading";
            const isActive = selected === a.id;

            return (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={`flex flex-col items-start gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all min-w-[7.5rem] ${
                  isActive
                    ? "bg-zinc-900 border-zinc-600 text-white ring-1 ring-emerald-500/30"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <span>
                  <span className="mr-1.5">{ASSET_ICONS[a.id] ?? "📊"}</span>
                  {a.symbol}
                </span>
                <span className="flex gap-1">
                  <ScoreBadge value={previewData?.health} kind="health" loading={previewLoading} />
                  <ScoreBadge value={previewData?.friction} kind="friction" loading={previewLoading} />
                </span>
              </button>
            );
          })}
        </div>

        {(error || stale) && (
          <div
            className={`rounded-lg px-4 py-3 text-sm flex items-start justify-between gap-3 ${
              stale
                ? "bg-amber-950/30 border border-amber-900/50 text-amber-300"
                : "bg-red-950/30 border border-red-900/50 text-red-400"
            }`}
          >
            <span>{error}</span>
            {loadPhase === "error" && (
              <button
                onClick={() => analyze(selected, { force: true })}
                className="shrink-0 text-xs font-mono underline underline-offset-2 hover:opacity-80"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {loadPhase === "loading" && !report && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
            <span className="font-mono text-sm">Fetching live metrics…</span>
          </div>
        )}

        {loadPhase === "slow" && !report && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
            <span className="font-mono text-sm text-amber-400/90">Still fetching — CoinGecko / DefiLlama can be slow</span>
            <span className="text-xs text-zinc-600">Timeout in ~15s · scoring uses ecosystem data if market API fails</span>
            <button
              onClick={() => analyze(selected, { force: true })}
              className="mt-2 text-xs font-mono text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
            >
              Cancel & retry
            </button>
          </div>
        )}

        {loadPhase === "error" && !report && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-zinc-500 text-sm text-center max-w-md">
              Could not reach live data APIs. Check your connection or try again in a moment.
            </p>
            <button
              onClick={() => analyze(selected, { force: true })}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Retry analysis
            </button>
          </div>
        )}

        {report && (
          <div className={`space-y-8 transition-opacity duration-300 ${isRefreshing ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            {isRefreshing && (
              <div className="text-center text-xs font-mono text-zinc-500 animate-pulse -mb-4">
                Refreshing {report.asset.symbol}…
              </div>
            )}

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

                <div className="flex gap-6 sm:gap-10 shrink-0">
                  {health && (
                    <ScoreRing
                      score={health.score}
                      polarity="positive"
                      label="Distribution Health"
                      sublabel={health.label}
                    />
                  )}
                  {friction && (
                    <ScoreRing
                      score={friction.score}
                      polarity="negative"
                      label="Compliance Friction"
                      sublabel={friction.label}
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
                        <span className="text-red-400 font-mono shrink-0 w-8">+{c.friction}</span>
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
          </div>
        )}
      </main>
    </div>
  );
}