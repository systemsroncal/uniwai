"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SendIcon from "@mui/icons-material/Send";
import type { Edge, Node } from "@xyflow/react";
import { useBuilderPreviewStore } from "@/src/stores/builder-preview";

type SmartphoneMockupProps = {
  open: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
};

export function SmartphoneMockup({ open, onClose, nodes, edges }: SmartphoneMockupProps) {
  const messages = useBuilderPreviewStore((s) => s.messages);
  const isTyping = useBuilderPreviewStore((s) => s.isTyping);
  const started = useBuilderPreviewStore((s) => s.started);
  const simulateUserReply = useBuilderPreviewStore((s) => s.simulateUserReply);
  const startFlow = useBuilderPreviewStore((s) => s.startFlow);
  const reset = useBuilderPreviewStore((s) => s.reset);
  const [draft, setDraft] = useState("");

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (!started) startFlow(edges, nodes, text);
    else simulateUserReply(text, edges, nodes);
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 380 }, p: 2 } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Live Preview
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton aria-label="Reset preview" onClick={() => reset()} size="small">
            <RestartAltIcon />
          </IconButton>
          <IconButton aria-label="Cerrar preview" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          mx: "auto",
          width: "100%",
          maxWidth: 330,
          height: 560,
          borderRadius: "2rem",
          border: 8,
          borderColor: "grey.900",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ bgcolor: "grey.900", color: "common.white", px: 2, py: 1 }}>
          <Typography variant="caption">UniWai Bot · Preview</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, bgcolor: "grey.50" }}>
          {messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4, px: 2 }}>
              Escribe un mensaje abajo para iniciar el flujo (ej: hola).
            </Typography>
          ) : (
            messages.map((message) => (
              <Box key={message.id} sx={{ mb: 1.25, display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box
                  sx={{
                    alignSelf: message.from === "bot" ? "flex-start" : "flex-end",
                    maxWidth: "85%",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: message.from === "bot" ? "background.paper" : "success.main",
                    color: message.from === "bot" ? "text.primary" : "success.contrastText",
                    boxShadow: 1,
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {message.text}
                </Box>
                {message.buttons?.length ? (
                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ alignSelf: "flex-start" }}>
                    {message.buttons.map((b) => (
                      <Button key={b} size="small" variant="outlined" sx={{ borderRadius: 4, textTransform: "none" }}>
                        {b}
                      </Button>
                    ))}
                  </Stack>
                ) : null}
              </Box>
            ))
          )}
          {isTyping ? (
            <Box
              sx={{
                alignSelf: "flex-start",
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: "background.paper",
                boxShadow: 1,
                fontSize: "0.8rem",
                color: "text.secondary",
                fontStyle: "italic",
              }}
            >
              escribiendo…
            </Box>
          ) : null}
        </Box>

        <Stack direction="row" spacing={1} sx={{ p: 1.5, borderTop: 1, borderColor: "divider" }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Escribe como usuario…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <IconButton color="primary" onClick={handleSend} aria-label="Enviar">
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Drawer>
  );
}
