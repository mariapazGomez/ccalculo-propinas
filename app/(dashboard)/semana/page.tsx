import Link from "next/link";
import { getSemanas } from "@/modules/turnos/queries";
import { createClient } from "@/lib/supabase/server";
import { crearSemana, eliminarSemana } from "@/modules/semanas/actions";

const ADMIN_EMAIL = "gomezgomariapaz@gmail.com";

function proximoLunes(): string {
  const hoy = new Date();
  const dow = hoy.getUTCDay();
  const diffHastaLunes = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  hoy.setUTCDate(hoy.getUTCDate() + (dow === 1 ? 0 : diffHastaLunes - dow + 1));
  const hoyDow = hoy.getUTCDay();
  if (hoyDow !== 1) {
    hoy.setUTCDate(hoy.getUTCDate() - (hoyDow === 0 ? 6 : hoyDow - 1));
  }
  return hoy.toISOString().split("T")[0];
}

function domingo(lunes: string): string {
  const d = new Date(lunes + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().split("T")[0];
}

export default async function SemanasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const semanas = await getSemanas();
  const defaultInicio = proximoLunes();
  const defaultFin = domingo(defaultInicio);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Semanas
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {semanas.length} semana{semanas.length !== 1 ? "s" : ""} registrada{semanas.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Formulario nueva semana (solo admin) */}
      {isAdmin && (
        <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#eef2ff" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Nueva semana</h2>
          </div>
          <form action={crearSemana} className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Fecha inicio
              </label>
              <input
                type="date"
                name="fecha_inicio"
                required
                defaultValue={defaultInicio}
                className="block rounded-xl border px-3.5 py-2 text-sm outline-none transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Fecha fin
              </label>
              <input
                type="date"
                name="fecha_fin"
                required
                defaultValue={defaultFin}
                className="block rounded-xl border px-3.5 py-2 text-sm outline-none transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              + Crear semana
            </button>
          </form>
        </div>
      )}

      {/* Lista de semanas */}
      {semanas.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ borderColor: "var(--border)", borderStyle: "dashed" }}>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "#f1f5f9" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No hay semanas registradas</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Crea una nueva semana para comenzar</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {semanas.map((semana) => {
            const fechaInicio = new Date(semana.fecha_inicio + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" });
            const fechaFin = new Date(semana.fecha_fin + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
            const abierta = semana.estado === "abierta";

            return (
              <li key={semana.id} className="flex items-center gap-3">
                <Link
                  href={`/semana/${semana.id}`}
                  className="group flex flex-1 items-center justify-between rounded-2xl border px-6 py-4 transition-all hover:shadow-md"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: abierta ? "#ecfdf5" : "#f8fafc" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        stroke={abierta ? "#10b981" : "#94a3b8"}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {fechaInicio} — {fechaFin}
                      </p>
                      {semana.creado_en && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          Creada el {new Date(semana.creado_en).toLocaleDateString("es-CL")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      abierta
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {abierta ? "Abierta" : "Cerrada"}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="transition-colors group-hover:stroke-slate-400">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>

                {isAdmin && (
                  <form action={eliminarSemana}>
                    <input type="hidden" name="semana_id" value={semana.id} />
                    <button
                      type="submit"
                      title="Eliminar semana"
                      className="flex h-[60px] w-10 items-center justify-center rounded-2xl border transition-all hover:border-rose-200 hover:bg-rose-50"
                      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
