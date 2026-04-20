import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "gomezgomariapaz@gmail.com";

const navLinks = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/trabajadores", label: "Trabajadores" },
  { href: "/admin/sucursales", label: "Sucursales" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/semana");

  return (
    <div className="space-y-6">
      {/* Admin nav */}
      <div className="flex items-center gap-1 overflow-x-auto">
        <span className="mr-2 shrink-0 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Admin
        </span>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100"
            style={{ color: "var(--text-secondary)" }}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
