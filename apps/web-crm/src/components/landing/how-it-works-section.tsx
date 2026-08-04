"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/src/components/ui/button";

const steps = [
  {
    step: "01",
    title: "Crea tu cuenta",
    text: "Regístrate como dueño de negocio y activa tu workspace en minutos.",
  },
  {
    step: "02",
    title: "Conecta WhatsApp",
    text: "Vincula tu número por QR o Meta Cloud API oficial según tu plan.",
  },
  {
    step: "03",
    title: "Diseña tu bot",
    text: "Usa plantillas o crea flujos con el editor visual y preview en vivo.",
  },
  {
    step: "04",
    title: "Vende y mide",
    text: "Gestiona prospectos en Kanban, lanza campañas y exporta reportes de ventas.",
  },
];

export function HowItWorksSection() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="border-y border-border bg-muted/30 py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold text-primary">Cómo funciona UniWai CRM</h2>
          <p className="mt-2 text-secondary">De cero a automatizado en cuatro pasos.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map(({ step, title, text }, i) => (
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-center md:text-left"
            >
              <span className="text-3xl font-bold text-accent/40">{step}</span>
              <h3 className="mt-2 text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-1 text-sm text-secondary">{text}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/register">
            <Button className="min-h-11 px-8">Empezar ahora — es gratis probar</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
