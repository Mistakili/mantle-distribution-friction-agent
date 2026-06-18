import { motion } from "framer-motion";

export function DistributionFlowViz({ frictionScore }: { frictionScore?: number }) {
  const blocked = frictionScore != null && frictionScore >= 6;

  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      <svg viewBox="0 0 320 200" className="w-full h-auto" aria-hidden>
        <defs>
          <linearGradient id="flow-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="flow-red" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* connection lines */}
        <motion.path
          d="M 70 100 H 130"
          stroke="url(#flow-green)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.path
          d="M 190 100 H 250"
          stroke={blocked ? "url(#flow-red)" : "url(#flow-green)"}
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: blocked ? 0.35 : 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
        />

        {/* Issuance node */}
        <motion.g
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <circle cx="50" cy="100" r="28" fill="#0a0a0a" stroke="#10b981" strokeWidth="2" />
          <text x="50" y="96" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
            ISSUE
          </text>
          <text x="50" y="108" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="bold">
            ✓
          </text>
        </motion.g>

        {/* Compliance gate */}
        <motion.g
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <rect x="130" y="68" width="60" height="64" rx="8" fill="#0a0a0a" stroke={blocked ? "#ef4444" : "#f59e0b"} strokeWidth="2" filter="url(#glow)" />
          <text x="160" y="92" textAnchor="middle" fill={blocked ? "#fca5a5" : "#fcd34d"} fontSize="8" fontFamily="monospace">
            COMPLIANCE
          </text>
          <text x="160" y="106" textAnchor="middle" fill={blocked ? "#fca5a5" : "#fcd34d"} fontSize="8" fontFamily="monospace">
            GATE
          </text>
          <text x="160" y="122" textAnchor="middle" fill={blocked ? "#ef4444" : "#f59e0b"} fontSize="14">
            {blocked ? "⛔" : "◎"}
          </text>
        </motion.g>

        {/* Holders node */}
        <motion.g
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: blocked ? 0.45 : 1 }}
          transition={{ delay: 0.5 }}
        >
          <circle cx="270" cy="100" r="28" fill="#0a0a0a" stroke={blocked ? "#52525b" : "#10b981"} strokeWidth="2" />
          <text x="270" y="96" textAnchor="middle" fill="#a1a1aa" fontSize="8" fontFamily="monospace">
            GLOBAL
          </text>
          <text x="270" y="108" textAnchor="middle" fill={blocked ? "#71717a" : "#6ee7b7"} fontSize="9" fontFamily="monospace">
            HOLDERS
          </text>
        </motion.g>

        {/* flowing particles */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            r="3"
            fill="#10b981"
            initial={{ cx: 75, cy: 100, opacity: 0 }}
            animate={{
              cx: [75, 125, blocked ? 155 : 265],
              cy: [100, 95 + i * 3, 100],
              opacity: [0, 1, blocked ? 0 : 0.8],
            }}
            transition={{
              duration: blocked ? 1.8 : 2.4,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeInOut",
            }}
          />
        ))}

        {blocked &&
          [0, 1].map((i) => (
            <motion.circle
              key={`block-${i}`}
              r="2"
              fill="#ef4444"
              initial={{ cx: 155, cy: 88, opacity: 0 }}
              animate={{ cx: [155, 145, 165], cy: [88, 112, 100], opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
      </svg>
      <p className="text-center text-[10px] font-mono text-zinc-600 mt-1">
        {blocked ? "Capital stops at compliance — not at mint" : "Flow open — friction still applies"}
      </p>
    </div>
  );
}