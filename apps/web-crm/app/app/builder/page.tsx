import { BotBuilderCanvas } from "@/src/components/builder/bot-builder-canvas";
import { SmartphoneMockup } from "@/src/components/builder/smartphone-mockup";

export default function BuilderPage() {
  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-900">Flow Builder + Live Preview</h1>
        <p className="text-sm text-slate-600">
          Base de React Flow + Zustand para preview en tiempo real sin persistencia.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <BotBuilderCanvas />
        <SmartphoneMockup />
      </div>
    </main>
  );
}
