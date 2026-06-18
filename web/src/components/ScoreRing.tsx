import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";

export function ScoreRing({
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
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="relative w-36 h-36">
        <motion.div
          className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
          animate={{ opacity: [0.2, 0.35, 0.2] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />
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
        <svg className="w-full h-full -rotate-90 relative z-[1]" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[2]">
          <span className={`text-3xl font-extrabold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            <AnimatedNumber value={score} />
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
    </motion.div>
  );
}