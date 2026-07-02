"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useBuilderPreviewStore } from "@/src/stores/builder-preview";
import { Button } from "@/src/components/ui/button";
import "@xyflow/react/dist/style.css";

const seedNodes: Node[] = [
  {
    id: "welcome",
    position: { x: 40, y: 60 },
    data: { label: "Welcome: Hola, ¿buscas información o catálogo?" },
    type: "default",
  },
  {
    id: "catalog",
    position: { x: 400, y: 10 },
    data: { label: "Catálogo: Te comparto productos disponibles." },
    type: "default",
  },
  {
    id: "agent",
    position: { x: 400, y: 160 },
    data: { label: "Human Handoff: Te conecta un asesor." },
    type: "default",
  },
];

const seedEdges: Edge[] = [
  { id: "e-welcome-catalog", source: "welcome", target: "catalog", label: "Catálogo" },
  { id: "e-welcome-agent", source: "welcome", target: "agent", label: "Asesor" },
];

export function BotBuilderCanvas() {
  const [nodes, , onNodesChange] = useNodesState(seedNodes);
  const [edges, , onEdgesChange] = useEdgesState(seedEdges);
  const setSelectedNode = useBuilderPreviewStore((state) => state.setSelectedNode);
  const simulateUserReply = useBuilderPreviewStore((state) => state.simulateUserReply);
  const reset = useBuilderPreviewStore((state) => state.reset);

  const onNodeClick = useMemo(
    () => (_event: unknown, node: Node) => {
      const text = typeof node.data?.label === "string" ? node.data.label : "Nodo sin texto";
      setSelectedNode(node.id, text);
    },
    [setSelectedNode],
  );

  return (
    <section className="flex h-[700px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Bot Builder (MVP shell)</h2>
          <p className="text-xs text-slate-500">
            Click en un nodo para actualizar el preview del smartphone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => simulateUserReply("Quiero ver el catálogo")}>
            Simular usuario
          </Button>
          <Button variant="outline" onClick={reset}>
            Reset preview
          </Button>
        </div>
      </div>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </section>
  );
}
