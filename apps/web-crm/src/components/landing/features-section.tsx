"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  Kanban,
  Megaphone,
  MessageSquare,
  Shield,
  ShoppingCart,
  Flame,
  BarChart3,
} from "lucide-react";

/** Features inspirados en plataformas LATAM tipo ChatPro, mejorados para UniWai. */
const features = [
  {
    icon: MessageSquare,
    title: "Inbox omnicanal unificado",
    text: "Todos tus números WhatsApp en un solo lugar. Responde manual o deja que el bot atienda mientras duermes.",
  },
  {
    icon: Kanban,
    title: "Pipeline Kanban de prospectos",
    text: "Arrastra leads de «Nuevo» a «Cierre». Toma el chat con un clic cuando el cliente necesita un humano.",
  },
  {
    icon: Bot,
    title: "Bot Builder visual + IA",
    text: "Hasta 20 flujos con botones, imágenes, catálogo y pagos in-chat. IA que solo responde sobre tu negocio.",
  },
  {
    icon: Flame,
    title: "Calentador anti-ban",
    text: "Red P2P de números, mensajes rotativos y simulación de «escribiendo…» para proteger tus líneas QR.",
  },
  {
    icon: Megaphone,
    title: "Marketing masivo inteligente",
    text: "Importa Excel, segmenta y envía campañas con límites seguros por canal (499 QR · hasta 3k Meta API).",
  },
  {
    icon: ShoppingCart,
    title: "Vende sin salir del chat",
    text: "Catálogo, carrito, ubicación Maps, envío local y Mercado Pago configurado en tu dashboard.",
  },
  {
    icon: BarChart3,
    title: "Reportes de ventas",
    text: "Exporta a Excel con resumen de órdenes y lista de compradores. Decisiones con datos reales.",
  },
  {
    icon: Shield,
    title: "Seguro para tu marca",
    text: "Multi-tenant aislado, roles Owner/Vendedor, anti-prompt-injection y panel superadmin de la plataforma.",
  },
];

export function FeaturesSection() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-primary">
          Todo lo que necesitas para vender más por WhatsApp
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-secondary">
          Más completo que un chatbot básico: CRM, automatización, campañas y e-commerce en una sola plataforma.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }, index) => (
          <motion.article
            key={title}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.22, delay: index * 0.03, ease: "easeOut" }}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-accent">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-primary">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
