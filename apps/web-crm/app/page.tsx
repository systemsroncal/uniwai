import { SiteHeader } from "@/src/components/layout/site-header";
import { SiteFooter } from "@/src/components/layout/site-footer";
import { LandingHero } from "@/src/components/landing-hero";
import { FeaturesSection } from "@/src/components/landing/features-section";
import { HowItWorksSection } from "@/src/components/landing/how-it-works-section";
import { PricingSection } from "@/src/components/landing/pricing-section";
import { LandingCtaSection } from "@/src/components/landing/landing-cta-section";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <LandingHero />
        </div>
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <LandingCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
