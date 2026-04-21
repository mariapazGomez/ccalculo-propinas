import { getAdminContext } from "@/modules/admin/queries";
import { getResumenHorasMes } from "@/modules/horas/queries";
import { redirect } from "next/navigation";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function HorasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const { organizacion_id, isAdmin } = await getAdminContext();
  if (!isAdmin || !organizacion_id) redirect("/semana");

  const params = await searchParams;
  const hoy = new Date();
  const anio = Number(params.anio ?? hoy.getFullYear());
  const mes = Number(params.mes ?? hoy.getMonth() + 1);

  const resumen = await getResumenHorasMes(organizacion_id, anio, mes);

  const totalHorasMes = resumen.reduce((s, r) => s + r.total_horas, 0);
  const totalTurnosMes = resumen.reduce((s, r) => s + r.total_turnos, 0);
  const trabajadoresConExceso = resumen.filter((r) =>
    r.turnosPorSemana.some((s) => s.excede)
  ).length;

  // Semanas únicas del mes para encabezados de columna
  const semanasUnicas = resumen[0]?.turnosPorSemana ?? [];

  const fmtFecha = (f: string) =>
    new Date(f + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" });

  function PorcentajeBar({ valor, maximo, excede }: { valor: number; maximo: number; excede: boolean }) {
    const pct = Math.min(100, maximo === 0 ? 0 : (valor / maximo) * 100);
    return (
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: excede
              ? "linear-gradient(90deg, #f43f5e, #fb7185)"
              : pct >= 80
              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
              : "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Control de horas
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Límite semanal: 44 h · Turno: 8 h
          </p>
        </div>

        {/* Selector de mes */}
        <form method="get" className="flex items-center gap-2">
          <select
            name="mes"
            defaultValue={mes}
            className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-indigo-400"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--surface)" }}
          >
            {MESES.map((nombre, i) => (
              <option key={i + 1} value={i + 1}>{nombre}</option>
            ))}
          </select>
          <select
            name="anio"
            defaultValue={anio}
            className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-indigo-400"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--surface)" }}
          >
            {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            Ver
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Turnos en {MESES[mes - 1]}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {totalTurnosMes}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {totalHorasMes} horas totales
          </p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Trabajadores activos
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {resumen.length}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            con datos en el mes
          </p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: trabajadoresConExceso > 0 ? "#fff1f2" : "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Exceden límite semanal
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight"
            style={{ color: trabajadoresConExceso > 0 ? "#f43f5e" : "var(--text-primary)" }}>
            {trabajadoresConExceso}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {trabajadoresConExceso > 0 ? "trabajadores sobre 44 h/semana" : "sin excesos este mes"}
          </p>
        </div>
      </div>

      {resumen.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ borderColor: "var(--border)", borderStyle: "dashed" }}>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#f1f5f9" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Sin datos para {MESES[mes - 1]} {anio}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            No hay semanas registradas en ese período
          </p>
        </div>
      ) : (
        <>
          {/* Tabla detallada — desktop */}
          <div className="hidden md:block overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)", background: "#fafbff" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Detalle por trabajador — {MESES[mes - 1]} {anio}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Trabajador
                    </th>
                    {semanasUnicas.map((s) => (
                      <th key={s.semana_id} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        <span className="block">{fmtFecha(s.fecha_inicio)}</span>
                        <span className="block font-normal" style={{ color: "var(--text-muted)" }}>→ {fmtFecha(s.fecha_fin)}</span>
                      </th>
                    ))}
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Total mes</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Horas disponibles</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.map((r, idx) => (
                    <tr key={r.trabajador_id} className="border-b last:border-0"
                      style={{ borderColor: "var(--border)", background: idx % 2 === 0 ? "var(--surface)" : "#fafbff" }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: `hsl(${(idx * 47) % 360}, 60%, 60%)` }}>
                            {r.nombre.charAt(0)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.nombre}</span>
                        </div>
                      </td>
                      {r.turnosPorSemana.map((s) => (
                        <td key={s.semana_id} className="px-3 py-4 text-center">
                          {s.turnos === 0 ? (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-center gap-1">
                                <span className={`text-sm font-bold ${s.excede ? "text-rose-500" : ""}`}
                                  style={{ color: s.excede ? undefined : "var(--text-primary)" }}>
                                  {s.horas}h
                                </span>
                                {s.excede && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                  </svg>
                                )}
                              </div>
                              <PorcentajeBar valor={s.horas} maximo={s.limite_horas} excede={s.excede} />
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                {s.turnos} turno{s.turnos !== 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                          {r.total_horas}h
                        </span>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          de {r.limite_horas_mes}h
                        </p>
                        <div className="mt-1.5 w-full">
                          <PorcentajeBar
                            valor={r.total_horas}
                            maximo={r.limite_horas_mes}
                            excede={r.total_horas > r.limite_horas_mes}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-sm font-bold ${r.horas_disponibles === 0 ? "text-rose-500" : "text-emerald-600"}`}>
                          {r.horas_disponibles}h
                        </span>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>disponibles</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjetas — móvil */}
          <div className="space-y-3 md:hidden">
            {resumen.map((r, idx) => {
              const pctMes = r.limite_horas_mes === 0 ? 0 : Math.min(100, (r.total_horas / r.limite_horas_mes) * 100);
              const tieneExceso = r.turnosPorSemana.some((s) => s.excede);
              return (
                <div key={r.trabajador_id} className="overflow-hidden rounded-2xl border"
                  style={{ background: "var(--surface)", borderColor: tieneExceso ? "#fecdd3" : "var(--border)" }}>
                  {/* Cabecera */}
                  <div className="flex items-center justify-between border-b px-4 py-3"
                    style={{ borderColor: "var(--border)", background: "#fafbff" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: `hsl(${(idx * 47) % 360}, 60%, 60%)` }}>
                        {r.nombre.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.nombre}</span>
                    </div>
                    {tieneExceso && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "#fff1f2", color: "#f43f5e" }}>
                        Excede límite
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Totales del mes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--text-secondary)" }}>Horas trabajadas</span>
                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                          {r.total_horas}h <span className="font-normal text-xs" style={{ color: "var(--text-muted)" }}>/ {r.limite_horas_mes}h</span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${pctMes}%`,
                            background: pctMes >= 100
                              ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                              : pctMes >= 80
                              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                              : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                          }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {r.total_turnos} turno{r.total_turnos !== 1 ? "s" : ""} · {r.total_horas}h
                        </span>
                        <span className={`text-xs font-semibold ${r.horas_disponibles === 0 ? "text-rose-500" : "text-emerald-600"}`}>
                          {r.horas_disponibles}h disponibles
                        </span>
                      </div>
                    </div>

                    {/* Por semana */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Por semana</p>
                      {r.turnosPorSemana.map((s) => (
                        <div key={s.semana_id} className="flex items-center gap-3 rounded-xl p-2.5"
                          style={{ background: s.excede ? "#fff1f2" : "#f8fafc" }}>
                          <div className="flex-1">
                            <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                              {fmtFecha(s.fecha_inicio)} — {fmtFecha(s.fecha_fin)}
                            </p>
                            <div className="mt-1 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                              <div className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, s.limite_horas === 0 ? 0 : (s.horas / s.limite_horas) * 100)}%`,
                                  background: s.excede ? "#f43f5e" : "#6366f1",
                                }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${s.excede ? "text-rose-500" : ""}`}
                              style={{ color: s.excede ? undefined : "var(--text-primary)" }}>
                              {s.horas}h
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {s.turnos} turno{s.turnos !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
