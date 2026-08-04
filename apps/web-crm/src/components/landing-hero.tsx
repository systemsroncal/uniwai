"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { MessageCircle, TrendingUp, Users, Zap } from "lucide-react";

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();
  const easeOut = "easeOut" as const;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-white via-slate-50 to-blue-50 p-8 shadow-sm md:p-12">
      <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="flex flex-col gap-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            CRM WhatsApp para PYMEs · Perú y LATAM
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-primary md:text-5xl">
            Automatiza ventas por WhatsApp y no pierdas ningún cliente.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-secondary">
            UniWai CRM centraliza conversaciones, bots inteligentes, pipeline Kanban, campañas masivas y
            cobros con Mercado Pago — todo desde un panel profesional, sin programar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button className="min-h-11 px-6">Probar gratis</Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" className="min-h-11 px-6">
                Ver planes
              </Button>
            </Link>
          </div>
          <p className="text-xs text-secondary">
            Sin tarjeta para empezar · Plan Básico desde $9.99/mes · Soporte en español
          </p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.06, ease: easeOut }}
          className="rounded-2xl border border-border bg-white p-5 shadow-md"
        >
          <p className="mb-4 text-sm font-medium text-primary">Resultados que importan a tu negocio</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MessageCircle, label: "Respuesta automática", value: "24/7" },
              { icon: TrendingUp, label: "Más conversiones", value: "+30%" },
              { icon: Users, label: "Equipo coordinado", value: "Kanban" },
              { icon: Zap, label: "Campañas masivas", value: "Excel" },
            ].map(({ icon: Icon, label, value }) => (
              <article key={label} className="rounded-xl bg-muted/60 p-3">
                <Icon className="mb-2 h-5 w-5 text-accent" aria-hidden />
                <p className="text-xs text-secondary">{label}</p>
                <p className="text-lg font-semibold text-primary">{value}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
