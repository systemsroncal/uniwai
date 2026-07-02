"use client";

import { useBuilderPreviewStore } from "@/src/stores/builder-preview";

export function SmartphoneMockup() {
  const messages = useBuilderPreviewStore((state) => state.messages);
  const selectedNodeId = useBuilderPreviewStore((state) => state.selectedNodeId);

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm">
      <div className="mx-auto h-[620px] max-w-[330px] rounded-[2rem] border-8 border-slate-900 bg-white p-3">
        <header className="mb-3 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
          Preview en vivo {selectedNodeId ? `· Nodo ${selectedNodeId}` : ""}
        </header>
        <div className="flex h-[530px] flex-col gap-2 overflow-y-auto rounded-md bg-slate-50 p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                message.from === "bot"
                  ? "self-start bg-white text-slate-800"
                  : "self-end bg-emerald-500 text-white"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
