"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import { apiFetch, type ContactRow } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ConfirmDeleteDialog } from "@/src/components/crm/confirm-delete-dialog";
import { EditContactDialog } from "@/src/components/crm/edit-contact-dialog";
import { normalizeToE164, DEFAULT_DIAL, isValidE164 } from "@/src/lib/phone";

type WaInstance = {
  id: string;
  label: string | null;
  phoneNumber: string | null;
  status: string;
};

type InboxStatus = {
  connectedCount: number;
  instances: WaInstance[];
};

type MessagesResponse = {
  data: Array<{
    id: string;
    direction: string;
    content: string | null;
    mediaUrl?: string | null;
    status: string;
    createdAt: string;
    sentAt: string | null;
  }>;
};

const POLL_MS = 8_000;
const POLL_MS_OFFLINE = 30_000;

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

function contactInitials(contact: ContactRow): string {
  if (contact.name) {
    return contact.name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
  return contact.phone.slice(-2);
}

export function InboxPanel() {
  const searchParams = useSearchParams();
  const contactFromUrl = searchParams.get("contact");

  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [instances, setInstances] = useState<WaInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(contactFromUrl);
  const [messages, setMessages] = useState<MessagesResponse["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const autoSelectedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollFailuresRef = useRef(0);
  const [apiOffline, setApiOffline] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);

  const connectedCount = instances.filter((i) => i.status === "CONNECTED").length;

  const loadMessages = useCallback(async (contactId: string, silent = false) => {
    try {
      const res = await apiFetch<MessagesResponse>(`/contacts/${contactId}/messages`);
      setMessages(res.data);
      pollFailuresRef.current = 0;
      setApiOffline(false);
    } catch (err) {
      if (!silent) setMessages([]);
      if (err instanceof Error && err.message.includes("API no disponible")) {
        pollFailuresRef.current += 1;
        setApiOffline(true);
      }
    }
  }, []);

  const loadInstances = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: InboxStatus }>("/contacts/inbox-status");
      setInstances(res.data.instances);
    } catch {
      setInstances([]);
    }
  }, []);

  const loadContacts = useCallback(
    async (opts?: { selectId?: string; silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ data: ContactRow[] }>("/contacts");
        setContacts(res.data);
        pollFailuresRef.current = 0;
        setApiOffline(false);

        if (opts?.selectId) {
          setSelectedId(opts.selectId);
        } else if (contactFromUrl) {
          setSelectedId(contactFromUrl);
        } else if (!autoSelectedRef.current && res.data.length) {
          autoSelectedRef.current = true;
          setSelectedId((prev) => prev ?? res.data[0].id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al cargar contactos";
        setError(msg);
        if (msg.includes("API no disponible")) {
          pollFailuresRef.current += 1;
          setApiOffline(true);
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [contactFromUrl],
  );

  useEffect(() => {
    void loadContacts();
    void loadInstances();
  }, [loadContacts, loadInstances]);

  useEffect(() => {
    if (contactFromUrl) setSelectedId(contactFromUrl);
  }, [contactFromUrl]);

  useEffect(() => {
    if (selectedId) void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled || document.hidden) {
        timer = setTimeout(tick, POLL_MS);
        return;
      }
      if (pollFailuresRef.current >= 2) {
        timer = setTimeout(tick, POLL_MS_OFFLINE);
        return;
      }
      void loadContacts({ silent: true });
      if (selectedId) void loadMessages(selectedId, true);
      const hasPending = messages.some((m) => m.status === "PENDING");
      timer = setTimeout(tick, hasPending ? 3_000 : apiOffline ? POLL_MS_OFFLINE : POLL_MS);
    };

    timer = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loadContacts, loadMessages, selectedId, apiOffline, messages]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.phone.toLowerCase().includes(q) ||
      (c.name?.toLowerCase().includes(q) ?? false) ||
      (c.lastMessage?.content?.toLowerCase().includes(q) ?? false)
    );
  });

  async function createContact(e: React.FormEvent) {
    e.preventDefault();
    const e164 = normalizeToE164(DEFAULT_DIAL, phone);
    if (!isValidE164(e164)) {
      setError("Teléfono inválido. Ejemplo: 987654321");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<{ data: ContactRow }>("/contacts", {
        method: "POST",
        body: JSON.stringify({ phone: e164, name: name || undefined }),
      });
      setPhone("");
      setName("");
      await loadContacts({ selectId: res.data.id });
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
      await loadContacts({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar bot");
    } finally {
      setBusy(false);
    }
  }

  async function deleteContact() {
    if (!deleteContactId) return;
    setBusy(true);
    try {
      await apiFetch(`/contacts/${deleteContactId}`, { method: "DELETE" });
      setDeleteContactId(null);
      if (selectedId === deleteContactId) {
        setSelectedId(null);
        setMessages([]);
      }
      await loadContacts({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la conversación");
    } finally {
      setBusy(false);
    }
  }

  async function saveContactEdit(payload: { phone: string; name: string; email: string }) {
    if (!editingContact) return;
    setBusy(true);
    try {
      await apiFetch<{ data: ContactRow }>(`/contacts/${editingContact.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          phone: payload.phone,
          name: payload.name || null,
          email: payload.email || null,
        }),
      });
      setEditingContact(null);
      await loadContacts({ silent: true, selectId: editingContact.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el contacto");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setBusy(true);

    const optimistic = {
      id: `tmp-${Date.now()}`,
      direction: "OUTBOUND",
      content: text,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await apiFetch<{
        data: MessagesResponse["data"][0];
        meta?: { queued?: boolean; hint?: string };
      }>(`/contacts/${selected.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      if (res.meta?.queued === false) {
        setError(res.meta.hint ?? "No se pudo encolar el mensaje en WhatsApp.");
      }
      await loadMessages(selected.id, true);
      await loadContacts({ silent: true });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      setError(err instanceof Error ? err.message : "No se pudo enviar mensaje");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      <CrmPageHeader
        title="Inbox"
        subtitle="Conversaciones de WhatsApp en tiempo real. Se actualiza cada pocos segundos."
      />

      {connectedCount === 0 ? (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" component={Link} href="/app/whatsapp">
              Conectar WhatsApp
            </Button>
          }
        >
          No hay números conectados. Los mensajes entrantes solo aparecen cuando el worker de WhatsApp está activo y el número está vinculado.
        </Alert>
      ) : (
        <Alert severity="success" icon={<WhatsAppIcon />} sx={{ py: 0.5 }}>
          {connectedCount} número{connectedCount > 1 ? "s" : ""} conectado{connectedCount > 1 ? "s" : ""}
          {instances
            .filter((i) => i.status === "CONNECTED")
            .map((i) => i.phoneNumber ?? i.label)
            .filter(Boolean)
            .join(" · ") && ` — ${instances.filter((i) => i.status === "CONNECTED").map((i) => i.phoneNumber ?? i.label).join(" · ")}`}
        </Alert>
      )}

      {apiOffline ? (
        <Alert severity="error">
          La API no responde en localhost:3001. En la terminal del proyecto ejecuta{" "}
          <strong>bun run stack:probar</strong> y espera a que aparezca &quot;API http://localhost:3001/health&quot;.
        </Alert>
      ) : null}

      {error && !apiOffline ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
          gap: 0,
          minHeight: { md: 560 },
          borderRadius: 3,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {/* Lista de contactos */}
        <Box
          sx={{
            borderRight: { md: 1 },
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            bgcolor: "action.hover",
          }}
        >
          <Box sx={{ p: 2, pb: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar conversación…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                sx: { bgcolor: "background.paper", borderRadius: 2 },
              }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1 }}>
            {loading ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress size={28} />
              </Stack>
            ) : filteredContacts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                {contacts.length === 0
                  ? "Sin conversaciones. Escribe a tu número conectado o agrega un contacto."
                  : "Ningún resultado para tu búsqueda."}
              </Typography>
            ) : (
              filteredContacts.map((contact) => {
                const active = selectedId === contact.id;
                const preview = contact.lastMessage?.content ?? "Sin mensajes";
                const previewTime = formatTime(
                  contact.lastMessage?.createdAt ?? contact.lastMessageAt,
                );
                return (
                  <Box
                    key={contact.id}
                    onClick={() => setSelectedId(contact.id)}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      bgcolor: active ? "background.paper" : "transparent",
                      boxShadow: active ? 1 : 0,
                      "&:hover": { bgcolor: "background.paper" },
                      mb: 0.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: active ? "primary.main" : "grey.600",
                        fontSize: "0.9rem",
                      }}
                    >
                      {contactInitials(contact)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {contact.name ?? contact.phone}
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={0.25} sx={{ flexShrink: 0, ml: 0.5 }}>
                          <IconButton
                            size="small"
                            aria-label="Editar contacto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingContact(contact);
                            }}
                            sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography variant="caption" color="text.secondary">
                            {previewTime}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ opacity: 0.85, fontSize: "0.8125rem" }}
                      >
                        {contact.lastMessage?.direction === "OUTBOUND" ? "Tú: " : ""}
                        {preview}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          <Divider />
          <Box component="form" onSubmit={createContact} sx={{ p: 2, display: "grid", gap: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Nuevo contacto
            </Typography>
            <TextField
              size="small"
              label="Teléfono"
              placeholder="987654321"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">{DEFAULT_DIAL}</InputAdornment>,
              }}
            />
            <TextField size="small" label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" size="small" variant="outlined" disabled={busy}>
              Agregar
            </Button>
          </Box>
        </Box>

        {/* Panel de chat */}
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: { xs: 420, md: 560 } }}>
          {selected ? (
            <>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider" }}
              >
                <Stack direction="row" alignItems="center" gap={1.5}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
                    {contactInitials(selected)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>
                      {selected.name ?? "Contacto"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selected.phone}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" gap={1} alignItems="center">
                  <Chip
                    size="small"
                    icon={selected.botEnabled ? <SmartToyOutlinedIcon /> : <PersonOffOutlinedIcon />}
                    label={selected.botEnabled ? "Bot activo" : "Humano"}
                    color={selected.botEnabled ? "primary" : "default"}
                    variant="outlined"
                    onClick={() => void toggleBot(!selected.botEnabled)}
                    disabled={busy}
                  />
                  <Button size="small" component={Link} href="/app/kanban" variant="text">
                    Kanban
                  </Button>
                  <IconButton
                    size="small"
                    aria-label="Editar contacto"
                    disabled={busy}
                    onClick={() => setEditingContact(selected)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Eliminar conversación"
                    disabled={busy}
                    onClick={() => setDeleteContactId(selected.id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  px: 2.5,
                  py: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark" ? "grey.900" : "grey.50",
                  backgroundImage: (t) =>
                    t.palette.mode === "dark"
                      ? "none"
                      : "radial-gradient(circle at 20% 20%, rgba(37,211,102,0.04) 0%, transparent 50%)",
                }}
              >
                {messages.length === 0 ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", py: 6 }}>
                    <WhatsAppIcon sx={{ fontSize: 48, color: "success.main", opacity: 0.4, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Sin mensajes aún.
                      <br />
                      Envía un WhatsApp a tu número conectado o escribe abajo.
                    </Typography>
                  </Stack>
                ) : (
                  messages.map((m) => {
                    const outbound = m.direction === "OUTBOUND";
                    return (
                      <Box
                        key={m.id}
                        sx={{
                          display: "flex",
                          justifyContent: outbound ? "flex-end" : "flex-start",
                          mb: 1.25,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: "75%",
                            px: 1.75,
                            py: 1,
                            borderRadius: outbound ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            bgcolor: outbound ? "primary.main" : "background.paper",
                            color: outbound ? "primary.contrastText" : "text.primary",
                            boxShadow: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {m.content ?? "—"}
                          </Typography>
                          {m.mediaUrl ? (
                            <Box sx={{ mt: 1 }}>
                              {/\.(jpe?g|png|gif|webp)(\?|$)/i.test(m.mediaUrl) ? (
                                <Box
                                  component="img"
                                  src={m.mediaUrl}
                                  alt="Adjunto"
                                  sx={{ maxWidth: "100%", borderRadius: 1, display: "block" }}
                                />
                              ) : (
                                <Typography
                                  component="a"
                                  href={m.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  variant="caption"
                                  sx={{ color: outbound ? "primary.contrastText" : "primary.main", textDecoration: "underline" }}
                                >
                                  📎 Ver archivo adjunto
                                </Typography>
                              )}
                            </Box>
                          ) : null}
                          <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={0.5} sx={{ mt: 0.25 }}>
                            <Typography
                              variant="caption"
                              sx={{ opacity: 0.7, fontSize: "0.65rem" }}
                            >
                              {formatTime(m.sentAt ?? m.createdAt)}
                            </Typography>
                            {outbound && m.status === "PENDING" ? (
                              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: "0.65rem" }}>
                                · enviando
                              </Typography>
                            ) : null}
                            {outbound && m.status === "FAILED" ? (
                              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "0.65rem", color: "error.light" }}>
                                · no enviado
                              </Typography>
                            ) : null}
                          </Stack>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </Box>

              <Box
                component="form"
                onSubmit={sendMessage}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Stack direction="row" gap={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
                    placeholder="Escribe un mensaje…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={busy}
                    helperText={
                      connectedCount === 0
                        ? "Conecta WhatsApp para enviar mensajes reales."
                        : "Requiere wa-worker activo (bun run stack:probar). Si falla, verás «no enviado»."
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={busy || !draft.trim()}
                    aria-label="Enviar"
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": { bgcolor: "primary.dark" },
                      "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 8, px: 3 }}>
              <WhatsAppIcon sx={{ fontSize: 64, color: "success.main", opacity: 0.35, mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Inbox UniWai
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
                Selecciona una conversación o conecta WhatsApp para recibir mensajes en tiempo real.
              </Typography>
              <Button
                component={Link}
                href="/app/whatsapp"
                variant="contained"
                startIcon={<WhatsAppIcon />}
                sx={{ mt: 2 }}
              >
                Ir a WhatsApp
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      <ConfirmDeleteDialog
        open={Boolean(deleteContactId)}
        title="Eliminar conversación"
        description="Se borrarán todos los mensajes de este contacto en el CRM. No elimina el chat en WhatsApp del teléfono."
        onClose={() => setDeleteContactId(null)}
        onConfirm={deleteContact}
        busy={busy}
      />

      <EditContactDialog
        open={Boolean(editingContact)}
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onSave={saveContactEdit}
        busy={busy}
      />
    </Stack>
  );
}
