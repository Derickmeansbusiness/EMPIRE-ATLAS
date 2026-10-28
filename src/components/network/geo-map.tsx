import Link from "next/link";
import type { NetworkNode } from "@/lib/data/network";

/**
 * Schematic geographic view: a plain equirectangular projection over a fixed North-American bounding box.
 * It is not a basemap and makes no claim about borders; it shows where documented nodes are located.
 */
const BOX = { latMin: 24, latMax: 50, lngMin: -126, lngMax: -66 };
const W = 960; const H = 480;

function project(lat: number, lng: number) {
  return { x: ((lng - BOX.lngMin) / (BOX.lngMax - BOX.lngMin)) * W, y: ((BOX.latMax - lat) / (BOX.latMax - BOX.latMin)) * H };
}

export function GeoMap({ nodes }: { nodes: NetworkNode[] }) {
  const located = nodes.filter((n) => n.lat != null && n.lng != null && n.lat >= BOX.latMin && n.lat <= BOX.latMax && n.lng >= BOX.lngMin && n.lng <= BOX.lngMax);
  const groups = new Map<string, NetworkNode[]>();
  for (const n of located) { const k = `${n.lat!.toFixed(2)},${n.lng!.toFixed(2)}`; groups.set(k, [...(groups.get(k) ?? []), n]); }
  const outside = nodes.filter((n) => n.lat != null && !located.includes(n));
  const unlocated = nodes.filter((n) => n.lat == null);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="card overflow-hidden p-2">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Schematic map of documented node locations across the continental United States" className="h-auto w-full">
          <rect width={W} height={H} fill="#111E2E" />
          {Array.from({ length: 13 }, (_, i) => BOX.lngMin + i * 5).map((lng) => { const { x } = project(BOX.latMin, lng); return <g key={lng}><line x1={x} y1={0} x2={x} y2={H} stroke="rgba(221,216,205,0.07)" /><text x={x + 3} y={H - 6} fill="rgba(221,216,205,0.35)" fontSize="10">{lng}°</text></g>; })}
          {Array.from({ length: 6 }, (_, i) => BOX.latMin + 1 + i * 5).map((lat) => { const { y } = project(lat, BOX.lngMin); return <g key={lat}><line x1={0} y1={y} x2={W} y2={y} stroke="rgba(221,216,205,0.07)" /><text x={4} y={y - 3} fill="rgba(221,216,205,0.35)" fontSize="10">{lat}°</text></g>; })}
          {Array.from(groups.entries()).map(([k, list]) => {
            const { x, y } = project(list[0]!.lat!, list[0]!.lng!);
            const r = 6 + Math.min(14, list.length * 2);
            const hasInvestor = list.some((n) => n.kind === "investor");
            return (
              <g key={k}>
                <circle cx={x} cy={y} r={r + 6} fill={hasInvestor ? "rgba(193,155,99,0.15)" : "rgba(221,216,205,0.08)"} />
                <circle cx={x} cy={y} r={r} fill={hasInvestor ? "#C19B63" : "#DDD8CD"} fillOpacity={0.9} stroke="#101722" strokeWidth={1.5} />
                <text x={x} y={y + 4} textAnchor="middle" fill="#101722" fontSize="11" fontWeight={600}>{list.length}</text>
                <text x={x + r + 8} y={y + 4} fill="#F7F5F0" fontSize="12">{list[0]!.geoLabel?.split(" (")[0]}</text>
              </g>
            );
          })}
          <text x={W - 8} y={16} textAnchor="end" fill="rgba(221,216,205,0.5)" fontSize="10">Equirectangular, schematic. Not a basemap.</text>
        </svg>
      </div>
      <aside className="card p-4">
        <p className="eyebrow mb-2">Documented locations</p>
        <ul className="space-y-3 text-xs">
          {Array.from(groups.values()).map((list) => (
            <li key={list[0]!.id}>
              <p className="text-ivory">{list[0]!.geoLabel}</p>
              <ul className="mt-1 space-y-0.5 text-platinum/80">{list.map((n) => <li key={n.id}><Link href={n.href} className="hover:text-gold">{n.label}</Link> <span className="text-slate-mist">· {n.kind}</span></li>)}</ul>
            </li>
          ))}
        </ul>
        {outside.length > 0 && <p className="mt-4 text-xs text-slate-mist">Outside the continental frame: {outside.map((n) => n.label).join(", ")}.</p>}
        {unlocated.length > 0 && <p className="mt-2 text-xs text-slate-mist">{unlocated.length} node{unlocated.length === 1 ? "" : "s"} without a documented location are not drawn.</p>}
        <p className="mt-4 text-[0.65rem] leading-relaxed text-slate-mist">Locations are headquarters or the transaction’s stated location from the seed record. The Equity Office portfolio was national; its marker is the company headquarters.</p>
      </aside>
    </div>
  );
}
