import { SiteHeader } from "@/src/components/layout/site-header";
import { SiteFooter } from "@/src/components/layout/site-footer";
import { LandingHero } from "@/src/components/landing-hero";
import { FeaturesSection } from "@/src/components/landing/features-section";
import { PricingSection } from "@/src/components/landing/pricing-section";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <LandingHero />
        </div>
        <FeaturesSection />
        <PricingSection />
        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
          <div className="rounded-2xl bg-primary px-6 py-10 text-center text-on-primary md:px-12">
            <h2 className="text-2xl font-semibold md:text-3xl">
              Empieza con Bun + Supabase en minutos
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
              Landing y CRM en Next.js 15. API en Hono. Workers BullMQ para WhatsApp QR y Meta Cloud API.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
