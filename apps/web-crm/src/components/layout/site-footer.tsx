import Link from "next/link";

const links = [
  { href: "#features", label: "Funciones" },
  { href: "#how-it-works", label: "Cómo funciona" },
  { href: "#pricing", label: "Planes" },
];

export function SiteFooter() {
  return (
    <footer id="security" className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-semibold text-primary">
              UniWai<span className="text-accent">CRM</span>
            </p>
            <p className="mt-2 text-sm text-secondary">
              Plataforma SaaS para automatizar ventas por WhatsApp. Bots, CRM, campañas y pagos para PYMEs.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Producto</p>
            <ul className="mt-2 space-y-1 text-sm text-secondary">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-accent">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/register" className="hover:text-accent">
                  Registro
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Confianza</p>
            <p className="mt-2 text-sm text-secondary">
              Datos aislados por negocio · Roles y permisos · Pagos cifrados en dashboard · Cumplimiento Meta API recomendado
            </p>
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-secondary">
          © {new Date().getFullYear()} UniWai CRM — uniwaicrm.com · uniwai.pe
        </p>
      </div>
    </footer>
  );
}
