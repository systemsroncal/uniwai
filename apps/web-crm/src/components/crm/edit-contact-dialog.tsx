"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ContactRow } from "@/src/lib/api";
import {
  DEFAULT_DIAL,
  PHONE_COUNTRIES,
  isValidE164,
  normalizeToE164,
  parseE164ToParts,
} from "@/src/lib/phone";

type EditContactDialogProps = {
  open: boolean;
  contact: ContactRow | null;
  onClose: () => void;
  onSave: (payload: { phone: string; name: string; email: string }) => Promise<void>;
  busy?: boolean;
};

export function EditContactDialog({
  open,
  contact,
  onClose,
  onSave,
  busy = false,
}: EditContactDialogProps) {
  const [dial, setDial] = useState(DEFAULT_DIAL);
  const [national, setNational] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contact || !open) return;
    const parts = parseE164ToParts(contact.phone);
    setDial(parts.dial);
    setNational(parts.national);
    setName(contact.name ?? "");
    setEmail(contact.email ?? "");
    setError(null);
  }, [contact, open]);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSave() {
    const e164 = normalizeToE164(dial, national);
    if (!isValidE164(e164)) {
      setError("Teléfono inválido. Usa formato internacional (+51…).");
      return;
    }
    setError(null);
    await onSave({
      phone: e164,
      name: name.trim(),
      email: email.trim(),
    });
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Editar contacto</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Stack direction="row" spacing={1}>
            <TextField
              select
              label="País"
              size="small"
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {PHONE_COUNTRIES.map((c) => (
                <MenuItem key={c.code} value={c.dial}>
                  {c.dial} {c.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Teléfono"
              size="small"
              fullWidth
              value={national}
              onChange={(e) => setNational(e.target.value.replace(/\D/g, ""))}
            />
          </Stack>
          <TextField
            label="Nombre"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del contacto"
          />
          <TextField
            label="Email"
            size="small"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="opcional"
          />
          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="contained" disabled={busy} onClick={() => void handleSave()}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
