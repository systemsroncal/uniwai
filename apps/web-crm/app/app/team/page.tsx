"use client";

import { useEffect, useState } from "react";
import { Permission } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { apiFetch } from "@/src/lib/api";
import { USER_ROLE_ES, labelEs } from "@uniwai/shared";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";
import { ConfirmDeleteDialog } from "@/src/components/crm/confirm-delete-dialog";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
};

export default function TeamPage() {
  const { can } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!can(Permission.MANAGE_TEAM)) router.replace("/app");
  }, [can, router]);

  async function loadTeam() {
    const res = await apiFetch<{ data: Member[] }>("/users");
    setTeam(res.data);
  }

  useEffect(() => {
    if (can(Permission.MANAGE_TEAM)) void loadTeam().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [can]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify({ email, name, password }) });
      setEmail("");
      setName("");
      setPassword("");
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo invitar vendedor");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(member: Member) {
    setEditMember(member);
    setEditName(member.name ?? "");
    setEditActive(member.isActive);
  }

  async function saveEdit() {
    if (!editMember) return;
    setBusy(true);
    try {
      await apiFetch(`/users/${editMember.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName, isActive: editActive }),
      });
      setEditMember(null);
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteMember() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await apiFetch(`/users/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar");
    } finally {
      setBusy(false);
    }
  }

  if (!can(Permission.MANAGE_TEAM)) return null;

  return (
    <ModulePage>
      <Stack spacing={3}>
        <CrmPageHeader title="Equipo" subtitle="Invita y administra vendedores." />
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Miembros</Typography>
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
              {team.map((member) => (
                <Stack key={member.id} direction="row" justifyContent="space-between" alignItems="center" py={2}>
                  <Box>
                    <Typography fontWeight={600}>{member.name ?? member.email}</Typography>
                    <Typography variant="body2" color="text.secondary">{member.email}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={labelEs(USER_ROLE_ES, member.role)} size="small" />
                    <Chip label={member.isActive ? "Activo" : "Inactivo"} size="small" color={member.isActive ? "success" : "default"} />
                    {member.role !== "OWNER" ? (
                      <>
                        <Button size="small" onClick={() => openEdit(member)}>Editar</Button>
                        <Button size="small" color="error" onClick={() => setDeleteId(member.id)}>Eliminar</Button>
                      </>
                    ) : null}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Nuevo vendedor</Typography>
            <Box component="form" onSubmit={invite} sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
              <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
              <TextField label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
              <TextField label="Contraseña temporal" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth inputProps={{ minLength: 8 }} />
              <Button type="submit" variant="contained" disabled={busy}>Crear vendedor</Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={Boolean(editMember)} onClose={() => setEditMember(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar miembro</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nombre" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
            <FormControlLabel control={<Switch checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMember(null)}>Cancelar</Button>
          <Button variant="contained" disabled={busy} onClick={() => void saveEdit()}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        title="Desactivar vendedor"
        description="El vendedor no podrá acceder al CRM."
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDeleteMember}
        busy={busy}
      />
    </ModulePage>
  );
}
