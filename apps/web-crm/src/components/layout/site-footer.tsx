export function SiteFooter() {
  return (
    <footer id="security" className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-secondary md:flex-row md:items-center md:justify-between md:px-6">
        <p>© {new Date().getFullYear()} UniWai CRM — uniwaicrm.com</p>
        <p>Multi-tenant · RLS · Rate limiting · BYOK · Sin source maps en producción</p>
      </div>
    </footer>
  );
}
