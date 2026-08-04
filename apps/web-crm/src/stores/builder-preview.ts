"use client";

import { create } from "zustand";
import type { Edge, Node } from "@xyflow/react";
import type { FlowNodeData } from "@uniwai/shared";
import { nodePreviewText, pickFlowText } from "@uniwai/shared";

type PreviewMessage = {
  id: string;
  from: "bot" | "user";
  text: string;
  buttons?: string[];
  mediaUrl?: string;
  typing?: boolean;
};

type BuilderPreviewState = {
  selectedNodeId: string | null;
  messages: PreviewMessage[];
  started: boolean;
  isTyping: boolean;
  setSelectedNode: (nodeId: string, text: string, buttons?: string[]) => void;
  simulateUserReply: (text: string, edges: Edge[], nodes: Node[]) => void;
  startFlow: (edges: Edge[], nodes: Node[], userText: string) => void;
  advancePreview: (edges: Edge[], nodes: Node[]) => void;
  reset: () => void;
};

function nodeData(node: Node): FlowNodeData {
  return (node.data ?? { label: "Nodo", nodeType: "message" }) as FlowNodeData;
}

function typingDelayMs(text: string): number {
  return Math.min(2000 + Math.random() * 2000 + text.length * 25, 6000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function findTrigger(nodes: Node[], text: string): Node | undefined {
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

function resolveNext(edges: Edge[], nodes: Node[], currentId: string, inbound: string): string | null {
  const lower = inbound.trim().toLowerCase();
  const out = edges.filter((e) => e.source === currentId);
  const current = nodes.find((n) => n.id === currentId);
  const data = current ? nodeData(current) : null;

  if (data?.nodeType === "buttons" && data.buttons?.length) {
    const btn = data.buttons.find((b) => b.label.toLowerCase() === lower);
    if (btn) {
      const edge = out.find((e) => e.sourceHandle === btn.id);
      if (edge) return edge.target;
    }
    return null;
  }

  return out[0]?.target ?? null;
}

function botMessageFromNode(node: Node): Omit<PreviewMessage, "id"> {
  const data = nodeData(node);
  const text = pickFlowText(data) ?? nodePreviewText(data);
  const buttons = data.buttons?.map((b) => b.label);
  return {
    from: "bot",
    text: data.nodeType === "media" && data.mediaUrl ? `${text}\n📎 ${data.mediaUrl}` : text,
    buttons,
    mediaUrl: data.nodeType === "media" ? data.mediaUrl : undefined,
  };
}

async function pushBotMessage(
  set: (fn: (s: BuilderPreviewState) => Partial<BuilderPreviewState>) => void,
  get: () => BuilderPreviewState,
  node: Node,
  nodeId: string,
): Promise<void> {
  const payload = botMessageFromNode(node);
  set(() => ({ isTyping: true }));
  await sleep(typingDelayMs(payload.text));
  set((state) => ({
    isTyping: false,
    selectedNodeId: nodeId,
    messages: [
      ...state.messages.filter((m) => !m.typing),
      { id: `node-${nodeId}-${Date.now()}`, ...payload },
    ],
  }));
}

export const useBuilderPreviewStore = create<BuilderPreviewState>((set, get) => ({
  selectedNodeId: null,
  messages: [],
  started: false,
  isTyping: false,

  setSelectedNode: (nodeId, text, buttons) =>
    set((state) => ({
      selectedNodeId: nodeId,
      messages: [
        ...state.messages.filter((msg) => msg.id !== `node-${nodeId}`),
        { id: `node-${nodeId}`, from: "bot", text, buttons },
      ],
    })),

  simulateUserReply: (text, edges, nodes) => {
    void (async () => {
      const { selectedNodeId, messages, started } = get();
      const userMsg: PreviewMessage = { id: `user-${Date.now()}`, from: "user", text };
      if (!started) {
        set({ messages: [...messages, userMsg], started: true });
        get().startFlow(edges, nodes, text);
        return;
      }
      if (!selectedNodeId) {
        set({ messages: [...messages, userMsg] });
        return;
      }
      const nextId = resolveNext(edges, nodes, selectedNodeId, text);
      set({ messages: [...messages, userMsg] });
      if (!nextId) return;
      const next = nodes.find((n) => n.id === nextId);
      if (!next) return;
      await pushBotMessage(set, get, next, nextId);
    })();
  },

  startFlow: (edges, nodes, userText) => {
    void (async () => {
      const start = findTrigger(nodes, userText);
      if (!start) return;
      let currentId = start.id;
      if (nodeData(start).nodeType === "trigger") {
        const edge = edges.find((e) => e.source === start.id);
        if (edge) currentId = edge.target;
      }
      const node = nodes.find((n) => n.id === currentId);
      if (!node) return;
      set({
        started: true,
        messages: [{ id: `user-${Date.now()}`, from: "user", text: userText }],
      });
      await pushBotMessage(set, get, node, currentId);
    })();
  },

  advancePreview: (edges, nodes) => {
    void (async () => {
      const { selectedNodeId } = get();
      if (!selectedNodeId) return;
      const edge = edges.find((e) => e.source === selectedNodeId);
      if (!edge) return;
      const next = nodes.find((n) => n.id === edge.target);
      if (!next) return;
      await pushBotMessage(set, get, next, next.id);
    })();
  },

  reset: () =>
    set({
      selectedNodeId: null,
      messages: [],
      started: false,
      isTyping: false,
    }),
}));
