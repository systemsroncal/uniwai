"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  LANDING_PLAN_ORDER,
  PLAN_CARD_HIGHLIGHTS,
  PLAN_TAGLINES,
  PLANS,
  PlanTier,
} from "@uniwai/shared";
import { Button } from "@/src/components/ui/button";
import { PlanComparisonTable } from "@/src/components/landing/plan-comparison-table";
import { Check } from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  const reduce = useReducedMotion();

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-primary">Elige el plan ideal para tu negocio</h2>
        <p className="mx-auto mt-2 max-w-2xl text-secondary">
          Precios en USD/mes. Escala números, flujos, vendedores y campañas según tu operación en LATAM.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {LANDING_PLAN_ORDER.map((tier, index) => {
          const plan = PLANS[tier];
          const highlighted = tier === PlanTier.PRO;
          const highlights = PLAN_CARD_HIGHLIGHTS[tier];

          return (
            <motion.article
              key={tier}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
              className={`flex flex-col rounded-2xl border p-5 ${
                highlighted
                  ? "border-accent bg-primary text-white shadow-lg ring-2 ring-accent/30"
                  : "border-border bg-white"
              }`}
            >
              {highlighted ? (
                <span className="mb-2 w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
                  Más popular
                </span>
              ) : null}

              <h3 className="text-lg font-semibold">{plan.label}</h3>
              <p
                className={`mt-1 min-h-[2.5rem] text-xs leading-relaxed ${
                  highlighted ? "text-slate-300" : "text-secondary"
                }`}
              >
                {PLAN_TAGLINES[tier]}
              </p>

              <p className={`mt-4 text-3xl font-bold tabular-nums ${highlighted ? "text-white" : "text-primary"}`}>
                {plan.priceUsdMonthly ? `$${plan.priceUsdMonthly}` : "Custom"}
                {plan.priceUsdMonthly ? (
                  <span className="text-sm font-medium opacity-80">/mes</span>
                ) : null}
              </p>

              <ul className={`mt-5 flex-1 space-y-2.5 text-sm ${highlighted ? "text-slate-200" : "text-secondary"}`}>
                {highlights.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${highlighted ? "text-emerald-300" : "text-accent"}`}
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/app" className="mt-6 block">
                <Button
                  variant={highlighted ? "outline" : "default"}
                  className={`min-h-11 w-full ${
                    highlighted ? "border-white/40 bg-white text-primary hover:bg-slate-100" : ""
                  }`}
                >
                  {tier === PlanTier.BASICO ? "Empezar gratis" : "Contratar plan"}
                </Button>
              </Link>
            </motion.article>
          );
        })}
      </div>

      <PlanComparisonTable />

      <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6 text-center">
        <h3 className="text-lg font-semibold text-primary">¿Necesitas más capacidad?</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-secondary">
          Plan Custom con white label, SLA, límites negociables e implementación asistida para agencias y
          corporativos.
        </p>
        <Link href="/app" className="mt-4 inline-block">
          <Button variant="outline" className="min-h-11">
            Solicitar cotización Custom
          </Button>
        </Link>
      </div>
    </section>
  );
}
