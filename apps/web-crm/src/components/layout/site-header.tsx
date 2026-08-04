import Link from "next/link";
import { Button } from "@/src/components/ui/button";

const nav = [
  { href: "#features", label: "Funciones" },
  { href: "#how-it-works", label: "Cómo funciona" },
  { href: "#pricing", label: "Planes" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
          UniWai<span className="text-accent">CRM</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-secondary transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="outline" className="hidden sm:inline-flex">
              Iniciar sesión
            </Button>
          </Link>
          <Link href="/register">
            <Button>Probar gratis</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
