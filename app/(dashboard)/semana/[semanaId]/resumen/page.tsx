import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcularPropinasSemana } from "@/modules/propinas/service";
import { guardarPropinasSemana, cerrarSemana } from "@/modules/propinas/actions";

export default async function ResumenPage({
  params,
}: {
  params: Promise<{ semanaId: string }>;
}) {
  const { semanaId } = await params;
  const admin = createAdminClient();

  const { data: semana } = await admin
    .from("semanas")
    .select("id, estado, fecha_inicio, fecha_fin")
    .eq("id", semanaId)
    .maybeSingle();

  if (!semana) notFound();

  const [resultados, { data: guardadas }] = await Promise.all([
    calcularPropinasSemana(semanaId),
    admin
      .from("propinas_calculadas")
      .select("trabajador_id, monto_total, total_participaciones, trabajadores(nombre)")
      .eq("semana_id", semanaId),
  ]);

  const yaGuardado = (guardadas?.length ?? 0) > 0;
  const abierta = semana.estado === "abierta";

  const totalCalculado = resultados.reduce((sum, r) => sum + r.monto_total, 0);
  const totalParticipaciones = resultados.reduce((sum, r) => sum + r.total_participaciones, 0);
  const totalGuardado = (guardadas ?? []).reduce((sum, r) => sum + r.monto_total, 0);

  const periodoLabel = semana.fecha_inicio && semana.fecha_fin
    ? `${new Date(semana.fecha_inicio + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" })} — ${new Date(semana.fecha_fin + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`
    : "";

  const fmt = (n: number) => `$${n.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={`/semana/${semanaId}`}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-slate-50"
            style={{ borderColor: "var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Distribución de propinas
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                abierta ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}>
                {abierta ? "Abierta" : "Cerrada"}
              </span>
              {yaGuardado && (
                <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Guardado
                </span>
              )}
            </div>
            {periodoLabel && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>{periodoLabel}</p>
            )}
          </div>
        </div>
      </div>

      {resultados.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ borderColor: "var(--border)", borderStyle: "dashed" }}>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#f1f5f9" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Sin datos para calcular</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Asigna trabajadores a los turnos y registra las propinas diarias primero.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Total a repartir
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {fmt(totalCalculado)}
              </p>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Participaciones
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {totalParticipaciones}
              </p>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Trabajadores
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {resultados.length}
              </p>
            </div>
          </div>

          {/* Tabla distribución */}
          <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)", background: "#fafbff" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Distribución calculada
              </h2>
            </div>
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Trabajador</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Turnos</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, i) => (
                  <tr key={r.trabajador_id} className="border-b last:border-0 transition-colors hover:bg-slate-50"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: `hsl(${(i * 47) % 360}, 60%, 60%)` }}>
                          {r.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: "#eef2ff", color: "#6366f1" }}>
                        {r.total_participaciones}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {fmt(r.monto_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid var(--border)`, background: "#fafbff" }}>
                  <td className="px-6 py-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Total</td>
                  <td className="px-6 py-3 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>{totalParticipaciones}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold" style={{ color: "#6366f1" }}>{fmt(totalCalculado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tabla guardada (semana cerrada) */}
          {yaGuardado && !abierta && (
            <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)", background: "#f0fdf4" }}>
                <h2 className="text-sm font-semibold text-emerald-800">Distribución final guardada</h2>
              </div>
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Trabajador</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Turnos</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Monto final</th>
                  </tr>
                </thead>
                <tbody>
                  {(guardadas ?? [])
                    .sort((a, b) => {
                      const na = (a.trabajadores as { nombre: string } | null)?.nombre ?? "";
                      const nb = (b.trabajadores as { nombre: string } | null)?.nombre ?? "";
                      return na.localeCompare(nb, "es");
                    })
                    .map((r) => {
                      const nombre = (r.trabajadores as { nombre: string } | null)?.nombre ?? r.trabajador_id;
                      return (
                        <tr key={r.trabajador_id} className="border-b last:border-0"
                          style={{ borderColor: "var(--border)" }}>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{nombre}</td>
                          <td className="px-6 py-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>{r.total_participaciones}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {fmt(Number(r.monto_total))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid var(--border)`, background: "#f0fdf4" }}>
                    <td className="px-6 py-3 text-sm font-bold text-emerald-800">Total</td>
                    <td />
                    <td className="px-6 py-3 text-right text-sm font-bold text-emerald-700">{fmt(totalGuardado)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {/* Acciones */}
      {abierta && resultados.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <form action={guardarPropinasSemana}>
            <input type="hidden" name="semana_id" value={semanaId} />
            <button
              type="submit"
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {yaGuardado ? "Recalcular y guardar" : "Guardar distribución"}
            </button>
          </form>

          <form action={cerrarSemana}>
            <input type="hidden" name="semana_id" value={semanaId} />
            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Guardar y cerrar semana
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
