"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  asignarTrabajadorATurno,
  quitarTrabajadorDeTurno,
  guardarPropinaDiaria,
} from "@/modules/turnos/actions";

type Trabajador = { id: string; nombre: string };

type TurnoCelda = {
  id: string;
  fecha: string;
  turno_codigo: string;
  trabajadores: Trabajador[];
  propina_dia: number | null;
  sucursal_id: string;
};

type FilaSemana = {
  fecha: string;
  nombreDia: string;
  am?: TurnoCelda;
  pm?: TurnoCelda;
  propina: number | null;
};

type Props = {
  semanaId: string;
  filas: FilaSemana[];
  trabajadores: Trabajador[];
};

export default function TurnosSemanaBoard({ semanaId, filas, trabajadores }: Props) {
  const router = useRouter();
  const [draggedWorker, setDraggedWorker] = useState<Trabajador | null>(null);
  const [hoveredTurnoId, setHoveredTurnoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const trabajadoresAsignadosIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fila of filas) {
      for (const t of fila.am?.trabajadores ?? []) ids.add(t.id);
      for (const t of fila.pm?.trabajadores ?? []) ids.add(t.id);
    }
    return ids;
  }, [filas]);

  function handleDrop(turnoDiaId: string) {
    if (!draggedWorker) return;
    const formData = new FormData();
    formData.set("turno_dia_id", turnoDiaId);
    formData.set("trabajador_id", draggedWorker.id);
    formData.set("semana_id", semanaId);
    startTransition(async () => {
      try {
        setError(null);
        await asignarTrabajadorATurno(formData);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al asignar trabajador");
      } finally {
        setDraggedWorker(null);
        setHoveredTurnoId(null);
      }
    });
  }

  function handleRemove(turnoDiaId: string, trabajadorId: string) {
    const formData = new FormData();
    formData.set("turno_dia_id", turnoDiaId);
    formData.set("trabajador_id", trabajadorId);
    formData.set("semana_id", semanaId);
    startTransition(async () => {
      try {
        setError(null);
        await quitarTrabajadorDeTurno(formData);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al quitar trabajador");
      }
    });
  }

  function renderTurnoCell(turno?: TurnoCelda, label?: string) {
    if (!turno) {
      return (
        <div className="flex min-h-[80px] items-center justify-center rounded-xl border-2 border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sin turno</span>
        </div>
      );
    }

    const isHovered = hoveredTurnoId === turno.id;
    const isAM = label === "AM";

    return (
      <div
        className="min-h-[80px] rounded-xl border-2 border-dashed p-3 transition-all"
        style={{
          borderColor: isHovered ? "#6366f1" : "var(--border)",
          background: isHovered ? "#eef2ff" : "transparent",
        }}
        onDragOver={(e) => { e.preventDefault(); setHoveredTurnoId(turno.id); }}
        onDragEnter={(e) => { e.preventDefault(); setHoveredTurnoId(turno.id); }}
        onDragLeave={() => { if (hoveredTurnoId === turno.id) setHoveredTurnoId(null); }}
        onDrop={(e) => { e.preventDefault(); handleDrop(turno.id); }}
      >
        {turno.trabajadores.length === 0 ? (
          <div className="flex h-full min-h-[56px] flex-col items-center justify-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              stroke={isHovered ? "#6366f1" : "#cbd5e1"}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-xs" style={{ color: isHovered ? "#6366f1" : "var(--text-muted)" }}>
              Arrastra aquí
            </span>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {turno.trabajadores.map((t, i) => (
              <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
                style={{ background: isAM ? "#eff6ff" : "#faf5ff" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: `hsl(${(i * 67) % 360}, 55%, 55%)` }}>
                    {t.nombre.charAt(0)}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {t.nombre}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(turno.id, t.id)}
                  disabled={pending}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-rose-100"
                  title="Quitar"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ background: "#fff1f2", borderColor: "#fecdd3", color: "#f43f5e" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Panel de trabajadores */}
        <aside className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Trabajadores</h2>
          </div>
          <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Arrastra hacia AM o PM
          </p>

          {trabajadores.length === 0 ? (
            <p className="text-center text-xs py-4" style={{ color: "var(--text-muted)" }}>
              Sin trabajadores activos
            </p>
          ) : (
            <ul className="space-y-2">
              {trabajadores.map((t) => {
                const yaAsignado = trabajadoresAsignadosIds.has(t.id);
                return (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={() => setDraggedWorker(t)}
                    onDragEnd={() => { setDraggedWorker(null); setHoveredTurnoId(null); }}
                    className="flex cursor-grab items-center gap-2.5 rounded-xl border px-3 py-2 select-none transition-all active:scale-95"
                    style={{
                      borderColor: yaAsignado ? "var(--border)" : "#c7d2fe",
                      background: yaAsignado ? "#f8fafc" : "#eef2ff",
                    }}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: yaAsignado ? "#cbd5e1" : "#6366f1" }}>
                      {t.nombre.charAt(0)}
                    </div>
                    <span className="text-xs font-medium truncate" style={{ color: yaAsignado ? "var(--text-muted)" : "var(--text-primary)" }}>
                      {t.nombre}
                    </span>
                    {yaAsignado && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Grilla de turnos */}
        <section className="overflow-x-auto rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {filas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-3">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Sin turnos generados</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Asegúrate de tener una sucursal configurada
              </p>
            </div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", background: "#fafbff" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Día</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                      AM
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      PM
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Propina del día</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={fila.fecha} className="border-b last:border-0 align-top"
                    style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "#fafbff" }}>
                    <td className="px-4 py-4 align-middle">
                      <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                        {fila.nombreDia.split(" ")[0]}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {fila.nombreDia.split(" ").slice(1).join(" ")}
                      </p>
                    </td>
                    <td className="px-4 py-4">{renderTurnoCell(fila.am, "AM")}</td>
                    <td className="px-4 py-4">{renderTurnoCell(fila.pm, "PM")}</td>
                    <td className="px-4 py-4 align-middle">
                      <form action={guardarPropinaDiaria} className="flex items-center gap-2">
                        <input type="hidden" name="fecha" value={fila.fecha} />
                        <input type="hidden" name="sucursal_id" value={fila.am?.sucursal_id ?? fila.pm?.sucursal_id ?? ""} />
                        <input type="hidden" name="semana_id" value={semanaId} />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>$</span>
                          <input
                            type="number"
                            name="monto_total"
                            min="0"
                            step="1"
                            defaultValue={fila.propina ?? ""}
                            className="w-28 rounded-xl border py-2 pl-6 pr-3 text-sm outline-none transition-colors"
                            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                            placeholder="0"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                          Guardar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
