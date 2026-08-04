"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

const CONFIRM_WORD = "BORRAR";

type ConfirmDeleteDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
};

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  onClose,
  onConfirm,
  busy = false,
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState("");

  function handleClose() {
    setTyped("");
    onClose();
  }

  async function handleConfirm() {
    if (typed !== CONFIRM_WORD) return;
    await onConfirm();
    setTyped("");
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Escribe <strong>{CONFIRM_WORD}</strong> para confirmar:
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={CONFIRM_WORD}
          autoComplete="off"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={typed !== CONFIRM_WORD || busy}
          onClick={() => void handleConfirm()}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
