import { login } from "@/modules/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Propinas
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Pezcalugón — Distribución semanal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <form action={login} className="space-y-4">
            <ErrorMessage searchParams={searchParams} />

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Correo electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="tu@correo.cl"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Contraseña
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
      style={{ background: "#fff1f2", color: "#f43f5e", border: "1px solid #fecdd3" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {decodeURIComponent(error)}
    </div>
  );
}
