"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { NetworkEdge, NetworkGraph, NetworkNode } from "@/lib/data/network";
import { VerificationBadge } from "@/components/research/status";

type AtlasNodeData = { node: NetworkNode; degree: number };
type AtlasNode = Node<AtlasNodeData, "atlas">;

const KIND_STYLE: Record<NetworkNode["kind"], string> = {
  investor: "border-gold bg-gold/20 text-ivory shadow-[0_0_0_6px_rgba(193,155,99,0.12)]",
  institution: "border-platinum/40 bg-midnight text-ivory",
  transaction: "border-positive/60 bg-positive/10 text-ivory",
};
const STATUS_STROKE: Record<string, { stroke: string; dash?: string }> = {
  verified_primary: { stroke: "#16876B" }, supported_secondary: { stroke: "#C19B63" }, contested: { stroke: "#D35C56", dash: "6 3" },
  unverified: { stroke: "#8A94A3", dash: "2 4" }, hypothetical: { stroke: "#7DD3FC", dash: "1 5" },
};

function AtlasNodeView({ data, selected }: NodeProps<AtlasNode>) {
  const n = data.node;
  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs leading-tight transition-shadow ${KIND_STYLE[n.kind]} ${selected ? "ring-2 ring-gold" : ""}`} style={{ maxWidth: 190 }}>
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <p className="font-medium">{n.label}</p>
      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-slate-mist">{n.subKind.replace(/_/g, " ")} · {data.degree}</p>
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}
const nodeTypes = { atlas: AtlasNodeView };

export function NetworkGraphView({ graph, positions }: { graph: NetworkGraph; positions: Record<string, { x: number; y: number }> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const degree = useMemo(() => { const d = new Map<string, number>(); for (const e of graph.edges) { d.set(e.source, (d.get(e.source) ?? 0) + 1); d.set(e.target, (d.get(e.target) ?? 0) + 1); } return d; }, [graph.edges]);
  const nodes: AtlasNode[] = useMemo(() => graph.nodes.map((n) => ({ id: n.id, type: "atlas", position: positions[n.id] ?? { x: 0, y: 0 }, data: { node: n, degree: degree.get(n.id) ?? 0 } })), [graph.nodes, positions, degree]);
  const edges: Edge[] = useMemo(() => graph.edges.map((e) => {
    const s = STATUS_STROKE[e.status] ?? STATUS_STROKE.unverified!;
    const dim = selected && e.source !== selected && e.target !== selected;
    return { id: e.id, source: e.source, target: e.target, label: e.relationship.replace(/_/g, " "), labelStyle: { fill: "#DDD8CD", fontSize: 9, letterSpacing: 1 }, labelBgStyle: { fill: "#111E2E", fillOpacity: 0.9 }, labelBgPadding: [4, 2] as [number, number], style: { stroke: s.stroke, strokeWidth: dim ? 1 : 1.8, strokeDasharray: s.dash, opacity: dim ? 0.25 : 1 }, animated: e.status === "hypothetical" };
  }), [graph.edges, selected]);
  const onNodeClick = useCallback((_: unknown, node: AtlasNode) => setSelected((cur) => (cur === node.id ? null : node.id)), []);
  const selectedNode = graph.nodes.find((n) => n.id === selected) ?? null;
  const selectedEdges: NetworkEdge[] = selectedNode ? graph.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id) : [];
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n] as const));
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="card h-[560px] overflow-hidden p-0" data-testid="network-graph">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={onNodeClick} onPaneClick={() => setSelected(null)} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.3} maxZoom={2} nodesDraggable nodesConnectable={false} elementsSelectable proOptions={{ hideAttribution: true }} colorMode="dark">
          <Background color="rgba(221,216,205,0.08)" gap={28} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
      <aside className="card p-4" aria-live="polite">
        {!selectedNode ? (
          <>
            <p className="eyebrow mb-2">Node detail</p>
            <p className="text-sm text-platinum/75">Click a node to see its relationships and the evidence behind each one. Drag to rearrange; scroll to zoom.</p>
            <div className="mt-4 space-y-1.5 text-xs">
              {Object.entries(STATUS_STROKE).map(([k, v]) => <div key={k} className="flex items-center gap-2"><svg width="28" height="6" aria-hidden="true"><line x1="0" y1="3" x2="28" y2="3" stroke={v.stroke} strokeWidth="2" strokeDasharray={v.dash} /></svg><span className="text-platinum/80">{k.replace(/_/g, " ")}</span></div>)}
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow mb-1">{selectedNode.kind} · {selectedNode.subKind.replace(/_/g, " ")}</p>
            <Link href={selectedNode.href} className="font-serif text-xl text-ivory hover:text-gold">{selectedNode.label}</Link>
            {selectedNode.geoLabel && <p className="mt-0.5 text-xs text-slate-mist">{selectedNode.geoLabel}</p>}
            {selectedNode.summary && <p className="mt-2 text-xs leading-relaxed text-platinum/75">{selectedNode.summary}</p>}
            <p className="mt-4 eyebrow">Relationships ({selectedEdges.length})</p>
            <ul className="mt-2 space-y-2">
              {selectedEdges.map((e) => {
                const other = nodeById.get(e.source === selectedNode.id ? e.target : e.source)!;
                return (
                  <li key={e.id} className="rounded-md border hairline p-2 text-xs">
                    <p className="text-platinum/85"><span className="text-gold-soft">{e.relationship.replace(/_/g, " ")}</span> <Link href={other.href} className="text-ivory hover:text-gold">{other.label}</Link>{e.startYear ? <span className="text-slate-mist"> · {e.startYear}{e.endYear ? `–${e.endYear}` : ""}</span> : null}</p>
                    {e.description && <p className="mt-0.5 text-slate-mist">{e.description}</p>}
                    <div className="mt-1 flex items-center gap-2">{e.status === "hypothetical" ? <span className="text-sky-200">hypothetical</span> : <VerificationBadge status={e.status} size="xs" />}{e.claimSlug && <Link href={`/evidence/claims/${e.claimSlug}`} className="text-slate-mist hover:text-gold">evidence →</Link>}</div>
                  </li>
                );
              })}
            </ul>
            <Link href={selectedNode.href} className="mt-4 inline-block text-xs text-gold hover:underline">Open {selectedNode.kind === "investor" ? "dossier" : selectedNode.kind === "transaction" ? "transaction" : "institution"} →</Link>
          </>
        )}
      </aside>
    </div>
  );
}
