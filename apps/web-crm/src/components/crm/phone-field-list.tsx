"use client";

import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DEFAULT_DIAL,
  PHONE_COUNTRIES,
  normalizeToE164,
  newRowId,
  parseE164ToParts,
} from "@/src/lib/phone";

export type PhoneRow = { id: string; dial: string; number: string };

export function emptyPhoneRow(): PhoneRow {
  return { id: newRowId(), dial: DEFAULT_DIAL, number: "" };
}

export function phoneRowsFromE164List(phones: string[]): PhoneRow[] {
  if (!phones.length) return [emptyPhoneRow()];
  return phones.map((p) => {
    const parts = parseE164ToParts(p);
    return { id: newRowId(), dial: parts.dial, number: parts.national };
  });
}

export function phoneRowsToE164(rows: PhoneRow[]): string[] {
  return rows
    .map((r) => normalizeToE164(r.dial, r.number))
    .filter((p) => p.length > 4);
}

type PhoneFieldListProps = {
  rows: PhoneRow[];
  onChange: (rows: PhoneRow[]) => void;
};

export function PhoneFieldList({ rows, onChange }: PhoneFieldListProps) {
  function updateRow(id: string, patch: Partial<PhoneRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    if (rows.length <= 1) {
      onChange([emptyPhoneRow()]);
      return;
    }
    onChange(rows.filter((r) => r.id !== id));
  }

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Números destino
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Elige el país y escribe solo el número local (sin código).
      </Typography>
      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Stack key={row.id} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <TextField
              select
              label="País"
              value={row.dial}
              onChange={(e) => updateRow(row.id, { dial: e.target.value })}
              size="small"
              sx={{ minWidth: { sm: 160 } }}
            >
              {PHONE_COUNTRIES.map((c) => (
                <MenuItem key={`${c.code}-${c.dial}`} value={c.dial}>
                  {c.label} ({c.dial})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Número"
              value={row.number}
              onChange={(e) => updateRow(row.id, { number: e.target.value.replace(/[^\d\s]/g, "") })}
              placeholder="999 888 777"
              size="small"
              fullWidth
              inputProps={{ inputMode: "numeric" }}
            />
            <IconButton aria-label="Eliminar número" onClick={() => removeRow(row.id)} color="error" size="small">
              <DeleteOutline />
            </IconButton>
          </Stack>
        ))}
        <Button
          startIcon={<AddOutlined />}
          onClick={() => onChange([...rows, emptyPhoneRow()])}
          size="small"
          sx={{ alignSelf: "flex-start" }}
        >
          Agregar número
        </Button>
      </Stack>
    </Box>
  );
}
