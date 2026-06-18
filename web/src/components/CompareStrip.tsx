import { motion } from "framer-motion";
import type { AssetScorePreview } from "../api";

interface AssetRow {
  id: string;
  symbol: string;
  icon: string;
  preview?: AssetScorePreview | "loading" | "error";
}

export function CompareStrip({
  assets,
  selected,
  onSelect,
}: {
  assets: AssetRow[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const ready = assets.filter((a) => a.preview && a.preview !== "loading" && a.preview !== "error");

  if (ready.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950/70 border border-zinc-800/60 rounded-xl p-4 overflow-x-auto"
    >
      <div className="text-xs font-mono text-zinc-500 mb-3 tracking-wider">LIVE COMPARISON</div>
      <div className="grid grid-cols-3 gap-3 min-w-[280px]">
        {assets.map((a) => {
          const p = a.preview && a.preview !== "loading" && a.preview !== "error" ? a.preview : null;
          const active = a.id === selected;

          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`rounded-lg p-3 text-left transition-all border ${
                active
                  ? "border-zinc-600 bg-zinc-900 ring-1 ring-emerald-500/20"
                  : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700"
              }`}
            >
              <div className="text-xs text-zinc-400 mb-2">
                {a.icon} {a.symbol}
              </div>
              {p ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.health / 10) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 w-6">{p.health.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-red-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.friction / 10) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-red-400 w-6">{p.friction.toFixed(1)}</span>
                  </div>
                </div>
              ) : (
                <div className="h-8 flex items-center">
                  <span className="text-[10px] text-zinc-600 animate-pulse font-mono">loading…</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}