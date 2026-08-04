"use client";

import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";

type DynamicFieldListProps = {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  minRows?: number;
  addLabel?: string;
};

export function DynamicFieldList({
  label,
  hint,
  values,
  onChange,
  placeholder,
  minRows = 1,
  addLabel = "Agregar línea",
}: DynamicFieldListProps) {
  const rows = values.length >= minRows ? values : [...values, ...Array(minRows - values.length).fill("")];

  function updateAt(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  }

  function removeAt(index: number) {
    if (rows.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, ""]);
  }

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {label}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {hint}
        </Typography>
      ) : null}
      <Stack spacing={1}>
        {rows.map((value, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
            <TextField
              value={value}
              onChange={(e) => updateAt(index, e.target.value)}
              placeholder={placeholder}
              fullWidth
              size="small"
              multiline
              minRows={1}
            />
            <IconButton
              aria-label="Eliminar"
              onClick={() => removeAt(index)}
              size="small"
              sx={{ mt: 0.5 }}
              color="error"
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Stack>
        ))}
        <Button startIcon={<AddOutlined />} onClick={addRow} size="small" sx={{ alignSelf: "flex-start" }}>
          {addLabel}
        </Button>
      </Stack>
    </Box>
  );
}
