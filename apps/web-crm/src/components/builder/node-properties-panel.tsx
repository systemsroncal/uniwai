"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Node } from "@xyflow/react";
import type { FlowNodeData, FlowNodeType, TextVariant } from "@uniwai/shared";
import { FLOW_NODE_LABELS, newVariantId } from "@uniwai/shared";
import { apiFetch } from "@/src/lib/api";

type NodePropertiesPanelProps = {
  node: Node | null;
  onChange: (nodeId: string, data: FlowNodeData) => void;
};

function normalizeVariants(data: FlowNodeData): TextVariant[] {
  if (data.textVariantItems?.length) return data.textVariantItems;
  return (data.textVariants ?? []).map((text, i) => ({
    id: `legacy-${i}`,
    text,
  }));
}

export function NodePropertiesPanel({ node, onChange }: NodePropertiesPanelProps) {
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<"openai" | "gemini" | "deepseek" | "nvidia">("openai");

  const variantItems = useMemo(
    () => (node ? normalizeVariants(node.data as FlowNodeData) : []),
    [node],
  );

  if (!node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Selecciona un nodo para editar texto, variantes, botones o disparadores.
        </Typography>
      </Box>
    );
  }

  const data = node.data as FlowNodeData;
  const nodeId = node.id;

  function patch(partial: Partial<FlowNodeData>) {
    onChange(nodeId, { ...data, ...partial, label: partial.label ?? data.label });
  }

  function setVariantItems(items: TextVariant[]) {
    patch({ textVariantItems: items, textVariants: undefined });
  }

  async function generateVariantsWithAi() {
    const base = data.text?.trim() || data.label;
    if (!base) {
      setAiError("Escribe un texto base antes de generar variantes.");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await apiFetch<{ data: { variants: string[] } }>("/botflows/generate-variants", {
        method: "POST",
        body: JSON.stringify({
          prompt: `Mensaje de saludo o respuesta de bot de WhatsApp: "${base}"`,
          provider: aiProvider,
          count: 5,
        }),
      });
      const newItems = res.data.variants
        .filter((v) => v !== data.text)
        .map((text) => ({ id: newVariantId(), text }));
      setVariantItems([...variantItems, ...newItems].slice(0, 8));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Error al generar con IA");
    } finally {
      setAiBusy(false);
    }
  }

  const showTextFields =
    data.nodeType === "message" ||
    data.nodeType === "buttons" ||
    data.nodeType === "media" ||
    data.nodeType === "handoff" ||
    data.nodeType === "list";

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        {FLOW_NODE_LABELS[data.nodeType as FlowNodeType] ?? data.nodeType}
      </Typography>

      <TextField
        size="small"
        label="Etiqueta del nodo"
        value={data.label}
        onChange={(e) => patch({ label: e.target.value })}
        fullWidth
      />

      {data.nodeType === "ai" && (
        <>
          <TextField
            size="small"
            label="Instrucciones para la IA"
            value={data.text ?? ""}
            onChange={(e) => patch({ text: e.target.value })}
            multiline
            minRows={4}
            helperText="Define personalidad, tono y qué debe hacer el bot durante la conversación."
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={data.aiUseSheet !== false}
                onChange={(e) => patch({ aiUseSheet: e.target.checked })}
              />
            }
            label="Usar Google Sheet del negocio como contexto"
          />
          <TextField
            size="small"
            label="URL de Sheet (opcional, sobreescribe la global)"
            value={data.sheetUrl ?? ""}
            onChange={(e) => patch({ sheetUrl: e.target.value || undefined })}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            fullWidth
          />
          <TextField
            select
            size="small"
            label="Proveedor IA"
            value={data.aiProvider ?? "openai"}
            onChange={(e) =>
              patch({ aiProvider: e.target.value as FlowNodeData["aiProvider"] })
            }
            fullWidth
          >
            <MenuItem value="openai">OpenAI</MenuItem>
            <MenuItem value="gemini">Gemini</MenuItem>
            <MenuItem value="deepseek">DeepSeek</MenuItem>
            <MenuItem value="nvidia">NVIDIA</MenuItem>
          </TextField>
          <Typography variant="caption" color="text.secondary">
            Este nodo responde con IA en cada mensaje del cliente, usando el historial del chat y los datos del Sheet.
          </Typography>
        </>
      )}

      {showTextFields && (
        <TextField
          size="small"
          label="Texto principal"
          value={data.text ?? ""}
          onChange={(e) => patch({ text: e.target.value })}
          multiline
          minRows={3}
          fullWidth
        />
      )}

      {showTextFields && (
        <>
          <Divider />
          <Typography variant="caption" fontWeight={600}>
            Variantes (rotación anti-monotonía)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            El bot elegirá una al azar en cada envío.
          </Typography>
          {variantItems.map((variant, idx) => (
            <Stack key={variant.id} direction="row" spacing={1} alignItems="flex-start">
              <TextField
                size="small"
                label={`Variante ${idx + 1}`}
                value={variant.text}
                onChange={(e) => {
                  const items = variantItems.map((v) =>
                    v.id === variant.id ? { ...v, text: e.target.value } : v,
                  );
                  setVariantItems(items);
                }}
                multiline
                minRows={2}
                fullWidth
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => setVariantItems(variantItems.filter((v) => v.id !== variant.id))}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setVariantItems([...variantItems, { id: newVariantId(), text: "" }])}
          >
            Agregar variante
          </Button>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <TextField
              select
              size="small"
              label="IA sugerencias"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as typeof aiProvider)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="gemini">Gemini</MenuItem>
              <MenuItem value="deepseek">DeepSeek</MenuItem>
              <MenuItem value="nvidia">NVIDIA</MenuItem>
            </TextField>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              disabled={aiBusy}
              onClick={() => void generateVariantsWithAi()}
            >
              {aiBusy ? "Generando…" : "Sugerir variantes"}
            </Button>
          </Stack>
          {aiError ? (
            <Typography variant="caption" color="error">
              {aiError}
            </Typography>
          ) : null}
        </>
      )}

      {data.nodeType === "trigger" && (
        <TextField
          size="small"
          label="Palabras clave (separadas por coma)"
          value={data.keywords ?? ""}
          onChange={(e) => patch({ keywords: e.target.value })}
          helperText="Ej: hola, menu, inicio"
          fullWidth
        />
      )}

      {data.nodeType === "media" && (
        <>
          <TextField
            size="small"
            label="URL pública del archivo (HTTPS)"
            value={data.mediaUrl ?? ""}
            onChange={(e) => patch({ mediaUrl: e.target.value })}
            placeholder="https://ejemplo.com/imagen.jpg"
            helperText="Debe ser una URL accesible (imagen, PDF o video). WhatsApp descarga el archivo desde aquí."
            fullWidth
          />
          <TextField
            size="small"
            select
            label="Tipo"
            value={data.mediaType ?? "image"}
            onChange={(e) => patch({ mediaType: e.target.value as FlowNodeData["mediaType"] })}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="image">Imagen</option>
            <option value="document">Documento</option>
            <option value="video">Video</option>
          </TextField>
        </>
      )}

      {data.nodeType === "delay" && (
        <TextField
          size="small"
          type="number"
          label="Segundos de espera"
          value={data.delaySec ?? 2}
          onChange={(e) => patch({ delaySec: Number(e.target.value) })}
          inputProps={{ min: 1, max: 30 }}
          fullWidth
        />
      )}

      {data.nodeType === "buttons" && (
        <>
          <Divider />
          <Typography variant="caption" fontWeight={600}>
            Botones (máx. 3)
          </Typography>
          {(data.buttons ?? []).map((btn, idx) => (
            <Stack key={btn.id} direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                label={`Botón ${idx + 1}`}
                value={btn.label}
                onChange={(e) => {
                  const buttons = [...(data.buttons ?? [])];
                  buttons[idx] = { ...buttons[idx], label: e.target.value };
                  patch({ buttons });
                }}
                fullWidth
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  const buttons = (data.buttons ?? []).filter((_, i) => i !== idx);
                  patch({ buttons });
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          {(data.buttons?.length ?? 0) < 3 && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                const buttons = [...(data.buttons ?? []), { id: `btn-${Date.now()}`, label: "Nueva opción" }];
                patch({ buttons });
              }}
            >
              Agregar botón
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
