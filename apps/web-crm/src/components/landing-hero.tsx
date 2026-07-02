"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/src/components/ui/button";

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();
  const easeOut = "easeOut" as const;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-white p-8 shadow-sm md:p-12">
      <div className="grid gap-8 md:grid-cols-[1.15fr_1fr]">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="flex flex-col gap-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            CRM WhatsApp · LATAM
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-primary md:text-5xl">
            Vende más por WhatsApp sin perder tu número.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-secondary">
            Bots con preview en vivo, Kanban de prospectos, calentador P2P, checkout in-chat y IA
            que solo responde sobre tu negocio.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/app">
              <Button className="min-h-11">Entrar al CRM</Button>
            </Link>
            <Link href="/app/builder">
              <Button variant="outline" className="min-h-11">
                Probar Bot Builder
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.06, ease: easeOut }}
          className="rounded-2xl border border-border bg-muted/50 p-5"
        >
          <p className="mb-3 text-sm font-medium text-primary">Panel en tiempo real</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Conversión", "+24%"],
              ["SLA respuesta", "1m 12s"],
              ["Bots activos", "10"],
              ["Órdenes hoy", "127"],
            ].map(([label, value]) => (
              <article key={label} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs text-secondary">{label}</p>
                <p className="text-xl font-semibold tabular-nums text-primary">{value}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
