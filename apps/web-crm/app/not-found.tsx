import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-primary">Página no encontrada</h1>
      <p className="text-secondary">La ruta que buscas no existe en UniWai CRM.</p>
      <Link href="/">
        <Button>Volver al inicio</Button>
      </Link>
    </main>
  );
}
