"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { apiFetch } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  source: string;
};

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Product[] }>("/products");
      setProducts(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar catálogo");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: description || undefined,
          price: Number(price),
          source: "SHEETS",
        }),
      });
      setName("");
      setPrice("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear producto");
    }
  }

  return (
    <ModulePage>
    <Stack spacing={3}>
      <CrmPageHeader
        title="Catálogo de productos"
        subtitle="Alimenta tu bot desde productos manuales, Google Sheets o catálogo nativo de WhatsApp Business."
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Agregar producto
          </Typography>
          <Box component="form" onSubmit={addProduct} sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Precio" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required fullWidth />
            <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} fullWidth />
            <Button type="submit" variant="contained">
              Guardar producto
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
        {products.map((p) => (
          <Card key={p.id} variant="outlined">
            <CardContent>
              <Typography fontWeight={600}>{p.name}</Typography>
              <Typography variant="h6" color="primary.main" sx={{ mt: 1 }}>
                {p.currency} {Number(p.price).toFixed(2)}
              </Typography>
              {p.description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {p.description}
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
    </ModulePage>
  );
}
