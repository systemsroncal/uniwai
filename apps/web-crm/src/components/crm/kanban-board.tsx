"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, type KanbanColumn } from "@/src/lib/api";
import { Button } from "@/src/components/ui/button";

type ColumnsResponse = { data: KanbanColumn[] };

export function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ColumnsResponse>("/kanban/columns");
      setColumns(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar Kanban");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function bootstrap() {
    setBusyId("bootstrap");
    try {
      await apiFetch("/kanban/bootstrap", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo inicializar");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleBot(contactId: string, enabled: boolean) {
    setBusyId(contactId);
    try {
      await apiFetch(`/contacts/${contactId}/bot-toggle`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar bot");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-secondary">Cargando pipeline…</p>;
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">CRM Kanban</h1>
          <p className="text-sm text-secondary">
            Gestiona prospectos y activa/desactiva el bot por contacto.
          </p>
        </div>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={busyId === "bootstrap"}
          onClick={() => void bootstrap()}
        >
          Inicializar columnas
        </Button>
      </header>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-red-50 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {columns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-secondary">
          No hay columnas. Pulsa «Inicializar columnas» o verifica que Supabase/Postgres esté
          corriendo.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {columns.map((column) => (
            <section
              key={column.id}
              className="rounded-2xl border border-border bg-white p-3 shadow-sm"
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-primary">{column.name}</h2>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-secondary">
                  {column._count.contacts}
                </span>
              </header>
              <div className="space-y-2">
                {column.contacts.length === 0 ? (
                  <p className="px-1 text-xs text-secondary">Sin prospectos</p>
                ) : (
                  column.contacts.map((contact) => (
                    <article
                      key={contact.id}
                      className="rounded-xl border border-border bg-muted/30 p-3"
                    >
                      <p className="text-sm font-medium text-primary">
                        {contact.name ?? "Sin nombre"}
                      </p>
                      <p className="text-xs text-secondary">{contact.phone}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          className="min-h-11 px-3 text-xs"
                          variant="outline"
                          disabled={busyId === contact.id}
                          onClick={() => void toggleBot(contact.id, !contact.botEnabled)}
                          aria-pressed={contact.botEnabled}
                        >
                          {contact.botEnabled ? "Bot ON" : "Bot OFF"}
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
