/** Tipos de nodos del Bot Builder (WhatsApp + flujo conversacional). */

export const FLOW_NODE_TYPES = [
  "trigger",
  "message",
  "buttons",
  "list",
  "media",
  "ai",
  "condition",
  "delay",
  "handoff",
] as const;

export type FlowNodeType = (typeof FLOW_NODE_TYPES)[number];

export type FlowButton = {
  id: string;
  label: string;
};

export type TextVariant = {
  id: string;
  text: string;
};

export type FlowNodeData = {
  label: string;
  nodeType: FlowNodeType;
  /** Texto del mensaje (message, buttons intro) o instrucciones del nodo IA */
  text?: string;
  /** Variantes con id estable (UI) */
  textVariantItems?: TextVariant[];
  /** @deprecated usar textVariantItems */
  textVariants?: string[];
  /** Botones de respuesta rápida (máx 3 WA) */
  buttons?: FlowButton[];
  /** URL de imagen/documento */
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video";
  /** Trigger: palabras clave separadas por coma */
  keywords?: string;
  /** Condición: expresión simple */
  condition?: string;
  /** Delay en segundos */
  delaySec?: number;
  /** Nodo IA: usar Google Sheet del tenant o URL propia */
  aiUseSheet?: boolean;
  /** Nodo IA: URL de sheet (opcional, sobreescribe la del tenant) */
  sheetUrl?: string;
  /** Nodo IA: proveedor openai|gemini|deepseek|nvidia */
  aiProvider?: "openai" | "gemini" | "deepseek" | "nvidia";
};

export type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  label?: string;
};

export const FLOW_NODE_LABELS: Record<FlowNodeType, string> = {
  trigger: "Disparador",
  message: "Mensaje",
  buttons: "Botones",
  list: "Lista",
  media: "Archivo",
  ai: "IA conversacional",
  condition: "Condición",
  delay: "Espera",
  handoff: "Asesor humano",
};

export function defaultNodeData(nodeType: FlowNodeType): FlowNodeData {
  switch (nodeType) {
    case "trigger":
      return { label: "Inicio", nodeType, keywords: "hola,menu,inicio" };
    case "message":
      return { label: "Mensaje", nodeType, text: "Hola, ¿en qué te ayudo?" };
    case "buttons":
      return {
        label: "Botones",
        nodeType,
        text: "Elige una opción:",
        buttons: [
          { id: "btn-1", label: "Catálogo" },
          { id: "btn-2", label: "Asesor" },
        ],
      };
    case "list":
      return { label: "Lista", nodeType, text: "Selecciona de la lista" };
    case "media":
      return { label: "Archivo", nodeType, text: "Te envío un archivo", mediaType: "image" };
    case "ai":
      return {
        label: "IA conversacional",
        nodeType,
        text: "Eres un asistente de ventas amable. Responde en español usando los datos del catálogo cuando pregunten por productos, precios o disponibilidad. Sé breve (máx 3 párrafos).",
        aiUseSheet: true,
      };
    case "condition":
      return { label: "Condición", nodeType, condition: "contains:catalogo" };
    case "delay":
      return { label: "Espera", nodeType, delaySec: 2 };
    case "handoff":
      return { label: "Asesor", nodeType, text: "Te conecto con un asesor humano." };
    default:
      return { label: "Nodo", nodeType: "message", text: "" };
  }
}

export function nodePreviewText(data: FlowNodeData): string {
  return pickFlowText(data) ?? data.label;
}

/** Elige texto principal o una variante aleatoria. */
export function pickFlowText(data: FlowNodeData): string | null {
  const fromItems = (data.textVariantItems ?? []).map((v) => v.text.trim()).filter(Boolean);
  const legacy = (data.textVariants ?? []).map((v) => v.trim()).filter(Boolean);
  const variants = fromItems.length ? fromItems : legacy;
  const pool = [data.text?.trim(), ...variants].filter(Boolean) as string[];
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
}

export function newVariantId(): string {
  return `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
