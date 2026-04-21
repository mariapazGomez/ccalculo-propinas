import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/modules/admin/queries";
import { getDashboardData } from "@/modules/dashboard/queries";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmtPeso(n: number) {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function fmtRango(inicio: string, fin: string) {
  const i = new Date(inicio + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" });
  const f = new Date(fin + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  return `${i} — ${f}`;
}

function BarraProgreso({ valor, maximo, color = "#6366f1" }: { valor: number; maximo: number; color?: string }) {
  const pct = maximo === 0 ? 0 : Math.min(100, (valor / maximo) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#e2e8f0" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default async function DashboardPage() {
  const { organizacion_id, isAdmin } = await getAdminContext();
  if (!organizacion_id) redirect("/semana");

  const data = await getDashboardData(organizacion_id);
  const {
    semanaActual, semanas, totalActivos, totalInactivos,
    ultimaCerrada, propinasUltimaSemana, totalUltimaSemana,
    horasMes, turnosAsignadosSemanaActual, propinasCargadasSemanaActual, mesActual,
  } = data;

  const abierta = semanaActual?.estado === "abierta";

  return (
    <div className="space-y-8">

      {/* ── Bienvenida ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Panel principal
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {MESES[mesActual.mes - 1]} {mesActual.anio}
        </p>
      </div>

      {/* ── Stats globales ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Semana activa */}
        <div className="rounded-2xl border p-5" style={{ background: abierta ? "#f0fdf4" : "var(--surface)", borderColor: abierta ? "#bbf7d0" : "var(--border)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Semana actual</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${abierta ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {semanaActual ? semanaActual.estado : "Sin semana"}
            </span>
          </div>
          <p className="mt-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {semanaActual ? fmtRango(semanaActual.fecha_inicio, semanaActual.fecha_fin) : "—"}
          </p>
          {semanaActual && (
            <Link href={`/semana/${semanaActual.id}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
              Ver grilla
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          )}
        </div>

        {/* Trabajadores */}
        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Trabajadores</p>
          <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{totalActivos}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            activos · {totalInactivos} inactivo{totalInactivos !== 1 ? "s" : ""}
          </p>
          {isAdmin && (
            <Link href="/admin/trabajadores" className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#6366f1" }}>
              Gestionar
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          )}
        </div>

        {/* Turnos semana actual */}
        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Turnos asignados</p>
          <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {turnosAsignadosSemanaActual}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>en la semana actual</p>
        </div>

        {/* Propinas cargadas semana actual */}
        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Días con propina</p>
          <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {propinasCargadasSemanaActual}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>registrados esta semana</p>
          {semanaActual && (
            <Link href={`/semana/${semanaActual.id}/resumen`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#6366f1" }}>
              Ver resumen
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          )}
        </div>
      </div>

      {/* ── Fila central: Propinas + Horas ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Propinas última semana cerrada */}
        <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)", background: "#fafbff" }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Propinas — última semana cerrada</h2>
              {ultimaCerrada && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {fmtRango(ultimaCerrada.fecha_inicio, ultimaCerrada.fecha_fin)}
                </p>
              )}
            </div>
            {ultimaCerrada && (
              <Link href={`/semana/${ultimaCerrada.id}/resumen`}
                className="text-xs font-medium hover:underline" style={{ color: "#6366f1" }}>
                Ver detalle
              </Link>
            )}
          </div>

          {propinasUltimaSemana.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin semanas cerradas aún</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {propinasUltimaSemana.map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: `hsl(${(i * 47) % 360}, 60%, 60%)` }}>
                    {p.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.nombre}</p>
                    <BarraProgreso valor={p.monto_total} maximo={totalUltimaSemana} />
                  </div>
                  <span className="shrink-0 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {fmtPeso(p.monto_total)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-3" style={{ background: "#fafbff" }}>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Total</span>
                <span className="text-sm font-bold" style={{ color: "#6366f1" }}>{fmtPeso(totalUltimaSemana)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Horas del mes */}
        <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)", background: "#fafbff" }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Horas — {MESES[mesActual.mes - 1]}</h2>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>Límite 44 h/semana · 8 h/turno</p>
            </div>
            {isAdmin && (
              <Link href="/horas" className="text-xs font-medium hover:underline" style={{ color: "#6366f1" }}>Ver detalle</Link>
            )}
          </div>

          {horasMes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin turnos registrados este mes</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {horasMes.map((h, i) => {
                const pct = h.limite === 0 ? 0 : Math.min(100, (h.horas / h.limite) * 100);
                const color = h.excede ? "#f43f5e" : pct >= 80 ? "#f59e0b" : "#6366f1";
                return (
                  <div key={h.nombre} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: `hsl(${(i * 67) % 360}, 55%, 58%)` }}>
                      {h.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{h.nombre}</p>
                        <span className="ml-2 shrink-0 text-xs font-semibold" style={{ color }}>
                          {h.horas}h
                          {h.excede && " ⚠︎"}
                        </span>
                      </div>
                      <BarraProgreso valor={h.horas} maximo={h.limite} color={color} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Semanas recientes ── */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)", background: "#fafbff" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Semanas recientes</h2>
          <Link href="/semana" className="text-xs font-medium hover:underline" style={{ color: "#6366f1" }}>Ver todas</Link>
        </div>

        {semanas.length === 0 ? (
          <p className="px-6 py-8 text-sm" style={{ color: "var(--text-muted)" }}>No hay semanas registradas.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {semanas.map((s) => {
              const esAbierta = s.estado === "abierta";
              return (
                <Link key={s.id} href={`/semana/${s.id}`}
                  className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: esAbierta ? "#ecfdf5" : "#f8fafc" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        stroke={esAbierta ? "#10b981" : "#94a3b8"}>
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {fmtRango(s.fecha_inicio, s.fecha_fin)}
                      </p>
                      {s.creado_en && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Creada {new Date(s.creado_en).toLocaleDateString("es-CL")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${esAbierta ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {esAbierta ? "Abierta" : "Cerrada"}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"
                      className="transition-colors group-hover:stroke-slate-400">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Accesos rápidos (solo admin) ── */}
      {isAdmin && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Accesos rápidos
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/semana", label: "Semanas", desc: "Ver y gestionar semanas", icon: "M3 4h18v2H3zM3 10h18v2H3zM3 16h18v2H3z", color: "#6366f1" },
              { href: "/horas", label: "Control de horas", desc: "Turnos y límites mensuales", icon: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l4 2", color: "#8b5cf6" },
              { href: "/admin/trabajadores", label: "Trabajadores", desc: "Inscribir y gestionar", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", color: "#06b6d4" },
              { href: "/admin/sucursales", label: "Sucursales", desc: "Configurar sucursales", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", color: "#10b981" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="group flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-md"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${item.color}18` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
