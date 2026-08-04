import { prisma } from "@uniwai/database";
import type { FlowEdge, FlowNode, FlowNodeData } from "@uniwai/shared";
import { pickFlowText } from "@uniwai/shared";
import { sendBaileysMedia, sendBaileysText } from "./adapters/baileys.js";
import { generateConversationReply } from "./lib/ai-chat.js";

function asNodes(raw: unknown): FlowNode[] {
  return Array.isArray(raw) ? (raw as FlowNode[]) : [];
}

function asEdges(raw: unknown): FlowEdge[] {
  return Array.isArray(raw) ? (raw as FlowEdge[]) : [];
}

function nodeData(node: FlowNode): FlowNodeData {
  return (node.data ?? { label: "Nodo", nodeType: "message" }) as FlowNodeData;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function nextNodeId(edges: FlowEdge[], nodeId: string): string | null {
  return edges.find((e) => e.source === nodeId)?.target ?? null;
}

function findStartNode(nodes: FlowNode[], text: string): FlowNode | undefined {
  const trigger = nodes.find((n) => nodeData(n).nodeType === "trigger");
  if (trigger) {
    const keywords = (nodeData(trigger).keywords ?? "")
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const lower = text.toLowerCase();
    if (keywords.length === 0 || keywords.some((k) => lower.includes(k))) {
      return trigger;
    }
  }
  return nodes.find((n) => nodeData(n).nodeType === "message") ?? nodes[0];
}

function resolveNextNode(
  nodes: FlowNode[],
  edges: FlowEdge[],
  currentId: string,
  inboundText: string,
): string | null {
  const lower = inboundText.trim().toLowerCase();
  const outEdges = edges.filter((e) => e.source === currentId);

  const byHandle = outEdges.find(
    (e) => e.sourceHandle && e.sourceHandle.toLowerCase() === lower,
  );
  if (byHandle) return byHandle.target;

  const byLabel = outEdges.find((e) => e.label?.trim().toLowerCase() === lower);
  if (byLabel) return byLabel.target;

  const current = nodes.find((n) => n.id === currentId);
  const data = current ? nodeData(current) : null;
  if (data?.nodeType === "buttons" && data.buttons?.length) {
    const btn = data.buttons.find((b) => b.label.toLowerCase() === lower);
    if (btn) {
      const edge = outEdges.find((e) => e.sourceHandle === btn.id);
      if (edge) return edge.target;
    }
    return null;
  }

  if (data?.nodeType === "message" || data?.nodeType === "trigger") {
    return outEdges[0]?.target ?? null;
  }

  return outEdges[0]?.target ?? null;
}

async function saveOutboundMessage(params: {
  tenantId: string;
  contactId: string;
  instanceId: string;
  content: string;
  mediaUrl?: string | null;
  ok: boolean;
}): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      tenantId: params.tenantId,
      contactId: params.contactId,
      whatsAppInstanceId: params.instanceId,
      direction: "OUTBOUND",
      status: params.ok ? "SENT" : "FAILED",
      content: params.content,
      mediaUrl: params.mediaUrl ?? null,
      sentAt: new Date(),
    },
  });
}

async function sendTextNode(
  instanceId: string,
  phone: string,
  tenantId: string,
  contactId: string,
  data: FlowNodeData,
): Promise<boolean> {
  let text = pickFlowText(data) ?? data.label;

  if (data.nodeType === "buttons" && data.buttons?.length) {
    text = [text, ...data.buttons.map((b, i) => `${i + 1}. ${b.label}`)].filter(Boolean).join("\n");
  }
  if (data.nodeType === "handoff") {
    text = data.text ?? "Un asesor humano te atenderá en breve.";
  }

  if (!text?.trim()) return true;

  const ok = await sendBaileysText(instanceId, phone, text);
  await saveOutboundMessage({
    tenantId,
    contactId,
    instanceId,
    content: text,
    ok,
  });
  return ok;
}

async function sendMediaNode(
  instanceId: string,
  phone: string,
  tenantId: string,
  contactId: string,
  data: FlowNodeData,
): Promise<boolean> {
  const caption = pickFlowText(data) ?? data.text ?? undefined;
  const mediaUrl = data.mediaUrl?.trim();

  if (!mediaUrl) {
    console.warn("[flow] Nodo Archivo sin URL — enviando solo texto");
    return sendTextNode(instanceId, phone, tenantId, contactId, {
      ...data,
      nodeType: "message",
      text: caption ?? "📎 Archivo no configurado (añade URL en el nodo)",
    });
  }

  const ok = await sendBaileysMedia(instanceId, phone, {
    mediaUrl,
    mediaType: data.mediaType ?? "image",
    caption,
  });

  const label =
    caption ??
    (data.mediaType === "image" ? "📷 Imagen" : data.mediaType === "video" ? "🎬 Video" : "📎 Documento");

  await saveOutboundMessage({
    tenantId,
    contactId,
    instanceId,
    content: label,
    mediaUrl,
    ok,
  });
  return ok;
}

/** Recorre nodos en cadena (mensaje → espera → archivo) hasta botones, IA o fin. */
async function executeNodeChain(params: {
  tenantId: string;
  contactId: string;
  instanceId: string;
  phone: string;
  userMessage: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  startId: string;
}): Promise<string> {
  let currentId: string | null = params.startId;
  let waitAt = params.startId;

  while (currentId) {
    const node = params.nodes.find((n) => n.id === currentId);
    if (!node) break;

    const data = nodeData(node);
    waitAt = currentId;

    if (data.nodeType === "trigger") {
      currentId = nextNodeId(params.edges, currentId);
      continue;
    }

    if (data.nodeType === "delay") {
      const sec = Math.min(Math.max(data.delaySec ?? 2, 1), 15);
      await sleep(sec * 1000);
      currentId = nextNodeId(params.edges, currentId);
      continue;
    }

    if (data.nodeType === "condition") {
      currentId = nextNodeId(params.edges, currentId);
      continue;
    }

    if (data.nodeType === "media") {
      await sendMediaNode(
        params.instanceId,
        params.phone,
        params.tenantId,
        params.contactId,
        data,
      );
      currentId = nextNodeId(params.edges, currentId);
      continue;
    }

    if (data.nodeType === "handoff") {
      await sendTextNode(
        params.instanceId,
        params.phone,
        params.tenantId,
        params.contactId,
        data,
      );
      await prisma.contact.update({
        where: { id: params.contactId },
        data: { botEnabled: false },
      });
      return currentId;
    }

    if (data.nodeType === "buttons") {
      await sendTextNode(
        params.instanceId,
        params.phone,
        params.tenantId,
        params.contactId,
        data,
      );
      return currentId;
    }

    if (data.nodeType === "ai") {
      const reply = await generateConversationReply({
        tenantId: params.tenantId,
        contactId: params.contactId,
        userMessage: params.userMessage,
        systemPrompt: data.text ?? "Eres un asistente útil del negocio.",
        useSheet: data.aiUseSheet !== false,
        sheetUrl: data.sheetUrl,
        provider: data.aiProvider,
      });
      const ok = await sendBaileysText(params.instanceId, params.phone, reply);
      await saveOutboundMessage({
        tenantId: params.tenantId,
        contactId: params.contactId,
        instanceId: params.instanceId,
        content: reply,
        ok,
      });
      return currentId;
    }

    // message, list
    await sendTextNode(
      params.instanceId,
      params.phone,
      params.tenantId,
      params.contactId,
      data,
    );
    currentId = nextNodeId(params.edges, currentId);
  }

  return waitAt;
}

export async function runFlowForInbound(params: {
  tenantId: string;
  contactId: string;
  instanceId: string;
  phone: string;
  text: string;
}): Promise<void> {
  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    select: {
      id: true,
      botEnabled: true,
      currentNodeId: true,
      activeBotFlowId: true,
    },
  });
  if (!contact?.botEnabled) return;

  const flow = contact.activeBotFlowId
    ? await prisma.botFlow.findFirst({
        where: { id: contact.activeBotFlowId, tenantId: params.tenantId },
      })
    : await prisma.botFlow.findFirst({
        where: { tenantId: params.tenantId, isActive: true, isPublished: true },
        orderBy: { updatedAt: "desc" },
      });

  if (!flow) return;

  const nodes = asNodes(flow.nodes);
  const edges = asEdges(flow.edges);
  if (!nodes.length) return;

  let startId: string | null = null;

  if (!contact.currentNodeId) {
    const start = findStartNode(nodes, params.text);
    if (!start) return;
    startId = start.id;
    if (nodeData(start).nodeType === "trigger") {
      startId = nextNodeId(edges, start.id) ?? start.id;
    }
  } else {
    const current = nodes.find((n) => n.id === contact.currentNodeId);
    const currentData = current ? nodeData(current) : null;
    if (currentData?.nodeType === "ai") {
      startId = contact.currentNodeId;
    } else {
      const advanced = resolveNextNode(nodes, edges, contact.currentNodeId, params.text);
      startId = advanced ?? contact.currentNodeId;
    }
  }

  if (!startId) return;

  const waitAt = await executeNodeChain({
    tenantId: params.tenantId,
    contactId: params.contactId,
    instanceId: params.instanceId,
    phone: params.phone,
    userMessage: params.text,
    nodes,
    edges,
    startId,
  });

  await prisma.contact.update({
    where: { id: params.contactId },
    data: {
      currentNodeId: waitAt,
      activeBotFlowId: flow.id,
      lastMessageAt: new Date(),
    },
  });
}
