"use client";

import { create } from "zustand";

type PreviewMessage = {
  id: string;
  from: "bot" | "user";
  text: string;
};

type BuilderPreviewState = {
  selectedNodeId: string | null;
  messages: PreviewMessage[];
  setSelectedNode: (nodeId: string, text: string) => void;
  simulateUserReply: (text: string) => void;
  reset: () => void;
};

const initialMessages: PreviewMessage[] = [
  { id: "seed-1", from: "bot", text: "Hola, soy UniWai Bot. ¿En qué te ayudo hoy?" },
];

export const useBuilderPreviewStore = create<BuilderPreviewState>((set) => ({
  selectedNodeId: null,
  messages: initialMessages,
  setSelectedNode: (nodeId, text) =>
    set((state) => ({
      selectedNodeId: nodeId,
      messages: [
        ...state.messages.filter((msg) => msg.id !== `node-${nodeId}`),
        { id: `node-${nodeId}`, from: "bot", text },
      ],
    })),
  simulateUserReply: (text) =>
    set((state) => ({
      messages: [...state.messages, { id: `user-${Date.now()}`, from: "user", text }],
    })),
  reset: () =>
    set({
      selectedNodeId: null,
      messages: initialMessages,
    }),
}));
