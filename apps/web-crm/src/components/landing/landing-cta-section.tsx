"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export function LandingCtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-6 py-12 text-center text-white md:px-12">
        <h2 className="text-2xl font-semibold md:text-3xl">
          Tu competencia ya vende por WhatsApp las 24 horas
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Deja de perder leads por responder tarde. UniWai CRM te da bots, equipo comercial, campañas y
          pagos en un solo lugar — pensado para negocios en Perú y Latinoamérica.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button className="min-h-11 bg-white px-8 text-primary hover:bg-slate-100">
              Crear cuenta gratis
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="min-h-11 border-white/40 px-8 text-white hover:bg-white/10">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
