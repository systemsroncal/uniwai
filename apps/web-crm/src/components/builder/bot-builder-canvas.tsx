"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import {
  FLOW_NODE_TYPES,
  FLOW_NODE_LABELS,
  defaultNodeData,
  nodePreviewText,
  type FlowNodeData,
  type FlowNodeType,
} from "@uniwai/shared";
import { useBuilderPreviewStore } from "@/src/stores/builder-preview";
import { apiFetch } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { flowNodeTypes } from "@/src/components/builder/flow-builder-nodes";
import { NodePropertiesPanel } from "@/src/components/builder/node-properties-panel";
import { SmartphoneMockup } from "@/src/components/builder/smartphone-mockup";
import "@xyflow/react/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "trigger-1",
    type: "flowNode",
    position: { x: 80, y: 80 },
    data: defaultNodeData("trigger"),
  },
  {
    id: "msg-1",
    type: "flowNode",
    position: { x: 380, y: 80 },
    data: defaultNodeData("message"),
  },
];

const initialEdges: Edge[] = [{ id: "e1", source: "trigger-1", target: "msg-1" }];

type FlowSummary = { id: string; name: string; updatedAt: string; isPublished?: boolean; isActive?: boolean };
type FlowFull = FlowSummary & { nodes: Node[]; edges: Edge[] };

function normalizeNodes(raw: unknown): Node[] {
  if (!Array.isArray(raw) || raw.length === 0) return initialNodes;
  return raw.map((item, index) => {
    const n = item as Node;
    const data = (n.data ?? {}) as Partial<FlowNodeData>;
    const nodeType = (data.nodeType ?? "message") as FlowNodeType;
    return {
      id: typeof n.id === "string" ? n.id : `node-${index}`,
      type: "flowNode",
      position:
        n.position && typeof n.position.x === "number" && typeof n.position.y === "number"
          ? n.position
          : { x: 80 + index * 140, y: 80 + (index % 3) * 100 },
      data: { ...defaultNodeData(nodeType), ...data, nodeType },
    };
  });
}

function normalizeEdges(raw: unknown, nodes: Node[]): Edge[] {
  if (!Array.isArray(raw)) return initialEdges;
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = raw
    .filter((e) => {
      const edge = e as Edge;
      return nodeIds.has(edge.source) && nodeIds.has(edge.target);
    })
    .map((e, i) => {
      const edge = e as Edge;
      return {
        id: edge.id ?? `e-${i}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        label: edge.label,
        animated: true,
      };
    });
  return edges.length ? edges : initialEdges;
}

function BotBuilderInner() {
  const searchParams = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [flowName, setFlowName] = useState("Mi flujo");
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [publish, setPublish] = useState(false);
  const [activate, setActivate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const [deleteFlowOpen, setDeleteFlowOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const { screenToFlowPosition } = useReactFlow();
  const setSelectedNode = useBuilderPreviewStore((s) => s.setSelectedNode);
  const resetPreview = useBuilderPreviewStore((s) => s.reset);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const loadFlowList = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: FlowSummary[] }>("/botflows");
      setFlows(res.data);
    } catch {
      /* ok */
    }
  }, []);

  const applyFlow = useCallback(
    (name: string, rawNodes: unknown, rawEdges: unknown, flowId = "") => {
      const normalized = normalizeNodes(rawNodes);
      setFlowName(name);
      setNodes(normalized);
      setEdges(normalizeEdges(rawEdges, normalized));
      setSelectedFlowId(flowId);
      setSelectedNodeId(null);
      resetPreview();
    },
    [setNodes, setEdges, resetPreview],
  );

  const loadFlow = useCallback(
    async (flowId: string) => {
      if (!flowId) return;
      setError(null);
      try {
        const res = await apiFetch<{ data: FlowFull }>(`/botflows/${flowId}`);
        applyFlow(res.data.name, res.data.nodes, res.data.edges, flowId);
        setPublish(Boolean(res.data.isPublished));
        setActivate(Boolean(res.data.isActive));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el flujo");
      }
    },
    [applyFlow],
  );

  const loadTemplate = useCallback(
    async (templateId: string) => {
      setError(null);
      try {
        const res = await apiFetch<{ data: FlowFull & { description?: string } }>(
          `/flow-templates/${templateId}`,
        );
        applyFlow(res.data.name, res.data.nodes, res.data.edges, "");
        setPublish(false);
        setActivate(false);
        setMessage(`Plantilla «${res.data.name}» cargada. Guarda para crear tu flujo.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la plantilla");
      }
    },
    [applyFlow],
  );

  useEffect(() => {
    void loadFlowList();
  }, [loadFlowList]);

  useEffect(() => {
    const flowId = searchParams.get("flowId");
    const templateId = searchParams.get("templateId");
    if (flowId) void loadFlow(flowId);
    else if (templateId) void loadTemplate(templateId);
  }, [searchParams, loadFlow, loadTemplate]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges],
  );

  async function saveFlow() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const body = { name: flowName, nodes, edges, isPublished: publish, isActive: activate };
      if (selectedFlowId) {
        await apiFetch(`/botflows/${selectedFlowId}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        const res = await apiFetch<{ data: FlowFull }>("/botflows", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setSelectedFlowId(res.data.id);
      }
      setMessage("Flujo guardado.");
      await loadFlowList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteFlow() {
    if (!selectedFlowId) return;
    try {
      await apiFetch(`/botflows/${selectedFlowId}`, { method: "DELETE" });
      setSelectedFlowId("");
      applyFlow("Mi flujo", initialNodes, initialEdges);
      setDeleteFlowOpen(false);
      await loadFlowList();
      setMessage("Flujo eliminado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  function addNode(nodeType: FlowNodeType) {
    const id = `${nodeType}-${Date.now()}`;
    const data = defaultNodeData(nodeType);
    const position = screenToFlowPosition({ x: 200 + Math.random() * 120, y: 160 + Math.random() * 80 });
    setNodes((nds) => [...nds, { id, type: "flowNode", position, data }]);
  }

  function updateNodeData(nodeId: string, data: FlowNodeData) {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data } : n)));
  }

  function confirmDeleteNode() {
    if (!deleteNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== deleteNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== deleteNodeId && e.target !== deleteNodeId));
    if (selectedNodeId === deleteNodeId) setSelectedNodeId(null);
    setDeleteNodeId(null);
  }

  const onNodeClick = useMemo(
    () => (_: unknown, node: Node) => {
      setSelectedEdgeId(null);
      setSelectedNodeId(node.id);
      const data = node.data as FlowNodeData;
      setSelectedNode(node.id, nodePreviewText(data), data.buttons?.map((b) => b.label));
    },
    [setSelectedNode],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        selected: e.id === selectedEdgeId,
        style: {
          ...(typeof e.style === "object" ? e.style : {}),
          strokeWidth: e.id === selectedEdgeId ? 2.5 : 1.5,
          stroke: e.id === selectedEdgeId ? "#ef5350" : "#64748b",
        },
      })),
    [edges, selectedEdgeId],
  );

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEdgeId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEdgeId, setEdges]);

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" gap={1}>
        <CrmPageHeader
          title="Bot Builder"
          subtitle="Diseña flujos conversacionales. Las plantillas son flujos base que puedes personalizar aquí."
        />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PlayCircleOutlineIcon />}
          onClick={() => setPreviewOpen(true)}
        >
          Live Preview
        </Button>
      </Stack>

      {message ? <Alert severity="success" onClose={() => setMessage(null)}>{message}</Alert> : null}
      {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={1} flexWrap="wrap" alignItems="center">
        <TextField size="small" label="Nombre del flujo" value={flowName} onChange={(e) => setFlowName(e.target.value)} sx={{ minWidth: 200 }} />
        <Button variant="contained" onClick={() => void saveFlow()} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
        <TextField
          select
          size="small"
          label="Cargar flujo"
          value={selectedFlowId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedFlowId(id);
            if (id) void loadFlow(id);
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">— Nuevo / seleccionar —</MenuItem>
          {flows.map((f) => (
            <MenuItem key={f.id} value={f.id}>
              {f.name} {f.isActive ? "· activo" : ""}
            </MenuItem>
          ))}
        </TextField>
        {selectedFlowId ? (
          <Button color="error" variant="outlined" onClick={() => setDeleteFlowOpen(true)}>
            Eliminar flujo
          </Button>
        ) : null}
        <FormControlLabel control={<Switch checked={publish} onChange={(e) => setPublish(e.target.checked)} />} label="Publicado" />
        <FormControlLabel control={<Switch checked={activate} onChange={(e) => setActivate(e.target.checked)} />} label="Activo" />
        {selectedEdgeId ? (
          <Button color="error" variant="outlined" size="small" onClick={deleteSelectedEdge}>
            Eliminar conexión
          </Button>
        ) : null}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Conexiones: clic en línea → Supr/Delete. Flujo: Disparador → Mensaje → IA conversacional (responde con contexto del Sheet). En Botones se pausa.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "200px 1fr 300px" },
          gap: 2,
          minHeight: { xs: 480, lg: "calc(100dvh - 220px)" },
          width: "100%",
        }}
      >
        <Card variant="outlined" sx={{ p: 1.5, alignSelf: "start" }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Nodos
          </Typography>
          <Stack spacing={0.5}>
            {FLOW_NODE_TYPES.map((t) => (
              <Button key={t} size="small" variant="text" sx={{ justifyContent: "flex-start" }} onClick={() => addNode(t)}>
                {FLOW_NODE_LABELS[t]}
              </Button>
            ))}
          </Stack>
        </Card>

        <Box sx={{ borderRadius: 2, border: 1, borderColor: "divider", overflow: "hidden", minHeight: 480, bgcolor: "background.paper" }}>
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            nodeTypes={flowNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedEdgeId(null);
              setSelectedNodeId(null);
            }}
            onEdgesDelete={() => setSelectedEdgeId(null)}
            deleteKeyCode={null}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap zoomable pannable />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </Box>

        <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", minHeight: 480, maxHeight: { lg: "calc(100dvh - 220px)" } }}>
          {selectedNode ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Propiedades
              </Typography>
              <IconButton size="small" color="error" aria-label="Eliminar nodo" onClick={() => setDeleteNodeId(selectedNode.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : null}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <NodePropertiesPanel node={selectedNode} onChange={updateNodeData} />
          </Box>
        </Card>
      </Box>

      <SmartphoneMockup open={previewOpen} onClose={() => setPreviewOpen(false)} nodes={nodes} edges={edges} />

      <Dialog open={Boolean(deleteNodeId)} onClose={() => setDeleteNodeId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Eliminar nodo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se quitarán también las conexiones de este nodo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteNodeId(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteNode}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteFlowOpen} onClose={() => setDeleteFlowOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Eliminar flujo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFlowOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDeleteFlow()}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function BotBuilderCanvas() {
  return (
    <ReactFlowProvider>
      <BotBuilderInner />
    </ReactFlowProvider>
  );
}
