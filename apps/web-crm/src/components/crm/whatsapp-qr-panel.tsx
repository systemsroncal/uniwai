"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import { apiFetch, ApiError } from "@/src/lib/api";

type QrResponse = {
  data: {
    status: string;
    qr: string | null;
    hint?: string;
    phoneNumber?: string | null;
  };
};

type WhatsAppQrPanelProps = {
  instanceId: string;
  status: string;
  onStatusChange?: (status: string, phoneNumber?: string | null) => void;
  onMissing?: () => void;
};

const POLL_MS = 12_000;

export function WhatsAppQrPanel({
  instanceId,
  status,
  onStatusChange,
  onMissing,
}: WhatsAppQrPanelProps) {
  const [liveStatus, setLiveStatus] = useState(status);
  const [qr, setQr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const lastStatusRef = useRef(status);

  useEffect(() => {
    setLiveStatus(status);
    lastStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status === "CONNECTED" || missing) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!active || document.hidden) return;
      try {
        const res = await apiFetch<QrResponse>(`/whatsapp/instances/${instanceId}/qr`);
        if (!active) return;

        const nextStatus = res.data.status;
        setLiveStatus(nextStatus);
        setQr(res.data.qr);
        setHint(res.data.hint ?? null);
        setPhoneNumber(res.data.phoneNumber ?? null);

        if (nextStatus !== lastStatusRef.current) {
          lastStatusRef.current = nextStatus;
          onStatusChange?.(nextStatus, res.data.phoneNumber);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setMissing(true);
          onMissing?.();
          return;
        }
      }
    };

    const schedule = () => {
      timer = setTimeout(async () => {
        await poll();
        if (active && !missing) schedule();
      }, POLL_MS);
    };

    void poll();
    schedule();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [instanceId, status, missing, onStatusChange, onMissing]);

  if (missing) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Esta instancia ya no existe. Actualiza la lista o crea una nueva.
      </Alert>
    );
  }

  if (liveStatus === "CONNECTED") {
    return (
      <Alert severity="success" icon={<CheckCircleOutline />} sx={{ mt: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          WhatsApp conectado
        </Typography>
        {phoneNumber ? (
          <Typography variant="body2">Número vinculado: {phoneNumber}</Typography>
        ) : (
          <Typography variant="body2">Sesión activa.</Typography>
        )}
      </Alert>
    );
  }

  if (!qr) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {hint ?? "Esperando código QR del worker…"}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Actualiza cada {POLL_MS / 1000} s
          </Typography>
        </Box>
      </Alert>
    );
  }

  const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qr)}`;

  return (
    <Box sx={{ mt: 2, textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        WhatsApp → Dispositivos vinculados → Vincular dispositivo
      </Typography>
      <Box
        component="img"
        src={imgUrl}
        alt="Código QR WhatsApp"
        sx={{ width: 220, height: 220, borderRadius: 2, border: 1, borderColor: "divider" }}
      />
    </Box>
  );
}
