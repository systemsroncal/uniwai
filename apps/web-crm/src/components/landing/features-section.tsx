"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Shield, ShoppingCart, Zap } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Bot Builder con Live Preview",
    text: "Hasta 20 flujos, Spintax, botones, listas y preview en mockup de smartphone sin guardar en DB.",
  },
  {
    icon: Zap,
    title: "Calentador anti-ban P2P",
    text: "Worker BullMQ con presencia composing, red de calentamiento y mensajes rotativos.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce in-chat",
    text: "Catálogo Sheets/WhatsApp, checkout con ubicación Maps y tarifas PostGIS.",
  },
  {
    icon: Shield,
    title: "IA BYOK segura",
    text: "OpenAI, Gemini o DeepSeek con middleware anti-prompt-injection por negocio.",
  },
];

export function FeaturesSection() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-primary">Plataforma completa para vender por WhatsApp</h2>
        <p className="mt-2 text-secondary">
          CRM omnicanal para LATAM: QR + Meta API, Kanban, remarketing inteligente y checkout sin salir del chat.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map(({ icon: Icon, title, text }, index) => (
          <motion.article
            key={title}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.22, delay: index * 0.04, ease: "easeOut" }}
            className="rounded-2xl border border-border bg-white p-6 shadow-sm"
          >
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-accent">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
