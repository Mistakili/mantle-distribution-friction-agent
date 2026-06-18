const PARTNERS = [
  { name: "Mantle", src: "/assets/mantle.png" },
  { name: "xStocks", src: "/assets/xstocks.png" },
  { name: "Maple Finance", src: "/assets/maple.jpg" },
  { name: "Aave", src: "/assets/aave.png" },
] as const;

export function PartnerStrip() {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-2">
      <span className="text-[10px] font-mono text-zinc-600 tracking-wider uppercase shrink-0">
        Ecosystem
      </span>
      {PARTNERS.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
          title={p.name}
        >
          <img
            src={p.src}
            alt={p.name}
            className="w-6 h-6 rounded-full object-cover border border-zinc-800/80 bg-zinc-900"
            loading="lazy"
          />
          <span className="text-xs text-zinc-500 hidden sm:inline">{p.name}</span>
        </div>
      ))}
    </div>
  );
}