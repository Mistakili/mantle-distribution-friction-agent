import { useState } from "react";

const SIZES = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
  hero: "w-28 h-28 sm:w-32 sm:h-32",
} as const;

type Size = keyof typeof SIZES;

export function AssetAvatar({
  src,
  symbol,
  size = "md",
  className = "",
  ring,
}: {
  src?: string | null;
  symbol: string;
  size?: Size;
  className?: string;
  ring?: "health" | "friction" | "neutral";
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  const ringClass =
    ring === "health"
      ? "ring-2 ring-emerald-500/40"
      : ring === "friction"
        ? "ring-2 ring-red-500/40"
        : ring === "neutral"
          ? "ring-1 ring-zinc-700"
          : "";

  return (
    <div
      className={`${SIZES[size]} rounded-full overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800/80 flex items-center justify-center ${ringClass} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={`${symbol} logo`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-bold text-zinc-400 font-mono">
          {symbol.slice(0, 3)}
        </span>
      )}
    </div>
  );
}

export function IssuerBadge({
  src,
  name,
  className = "",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-zinc-500 ${className}`}
      title={name}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          className="w-4 h-4 rounded-full object-cover border border-zinc-800"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : null}
      <span>{name}</span>
    </span>
  );
}