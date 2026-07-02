"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, type ContactRow } from "@/src/lib/api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

type ContactsResponse = { data: ContactRow[] };

export function InboxPanel() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ContactsResponse>("/contacts");
      setContacts(res.data);
      if (res.data.length && !selectedId) setSelectedId(res.data[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contactos");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  async function createContact(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/contacts", {
        method: "POST",
        body: JSON.stringify({ phone, name: name || undefined }),
      });
      setPhone("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear contacto");
    } finally {
      setBusy(false);
    }
  }

  async function toggleBot(enabled: boolean) {
    if (!selected) return;
    setBusy(true);
    try {
      await apiFetch(`/contacts/${selected.id}/bot-toggle`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar bot");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-primary">Inbox omnicanal</h1>
        <p className="text-sm text-secondary">
          Conversaciones con toggle de bot y takeover humano.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-red-50 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-white p-3 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-primary">Contactos</h2>
          {loading ? (
            <p className="text-xs text-secondary">Cargando…</p>
          ) : (
            <ul className="space-y-1">
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(contact.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedId === contact.id
                        ? "bg-primary text-white"
                        : "hover:bg-muted text-primary"
                    }`}
                  >
                    <span className="block font-medium">{contact.name ?? contact.phone}</span>
                    <span className="block text-xs opacity-80">{contact.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={createContact} className="mt-4 space-y-2 border-t border-border pt-4">
            <Input
              label="Teléfono"
              name="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Nombre"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" className="min-h-11 w-full" disabled={busy}>
              Agregar contacto
            </Button>
          </form>
        </aside>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          {selected ? (
            <>
              <h2 className="text-lg font-semibold text-primary">
                {selected.name ?? "Contacto"}
              </h2>
              <p className="text-sm text-secondary">{selected.phone}</p>
              <p className="mt-2 text-xs text-secondary">
                Bot: {selected.botEnabled ? "activo" : "pausado (humano)"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={busy}
                  onClick={() => void toggleBot(!selected.botEnabled)}
                >
                  {selected.botEnabled ? "Pausar bot (humano)" : "Reactivar bot"}
                </Button>
              </div>
              <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-secondary">
                El hilo de mensajes se conectará cuando el worker de WhatsApp esté activo.
              </div>
            </>
          ) : (
            <p className="text-sm text-secondary">Selecciona un contacto o crea uno nuevo.</p>
          )}
        </div>
      </div>
    </section>
  );
}
