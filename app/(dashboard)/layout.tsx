import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/modules/auth/actions";

const ADMIN_EMAIL = "gomezgomariapaz@gmail.com";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-50 border-b bg-white" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/semana" className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Propinas
                </span>
                <span className="hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex"
                  style={{ background: "#eef2ff", color: "#6366f1" }}>
                  Pezcalugón
                </span>
              </Link>

              <nav className="flex items-center gap-1">
                <Link
                  href="/semana"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Semanas
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-xs sm:block" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-50"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
