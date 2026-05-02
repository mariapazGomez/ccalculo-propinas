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
  mostrarPropinas?: boolean;
  horasPorTrabajador?: Record<string, number>;
  limiteHoras?: number;
  domingoRestringidoIds?: string[];
};

export default function TurnosSemanaBoard({
  semanaId,
  filas,
  trabajadores,
  mostrarPropinas = true,
  horasPorTrabajador = {},
  limiteHoras = 40,
  domingoRestringidoIds = [],
}: Props) {
  const router = useRouter();
  const [draggedWorker, setDraggedWorker] = useState<Trabajador | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Trabajador | null>(null);
  const [hoveredTurnoId, setHoveredTurnoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const domingoRestringidoSet = useMemo(() => new Set(domingoRestringidoIds), [domingoRestringidoIds]);
  const fechasDomingo = useMemo(
    () => new Set(filas.filter((f) => new Date(f.fecha + "T12:00:00").getDay() === 0).map((f) => f.fecha)),
    [filas]
  );
  const selectedEsRestringidoDomingo = selectedWorker ? domingoRestringidoSet.has(selectedWorker.id) : false;

  const trabajadoresAsignadosIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fila of filas) {
      for (const t of fila.am?.trabajadores ?? []) ids.add(t.id);
      for (const t of fila.pm?.trabajadores ?? []) ids.add(t.id);
    }
    return ids;
  }, [filas]);

  function assign(turnoDiaId: string, worker: Trabajador) {
    const formData = new FormData();
    formData.set("turno_dia_id", turnoDiaId);
    formData.set("trabajador_id", worker.id);
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
        setSelectedWorker(null);
        setHoveredTurnoId(null);
      }
    });
  }

  function handleDrop(turnoDiaId: string) {
    if (draggedWorker) assign(turnoDiaId, draggedWorker);
  }

  function handleTapSlot(turno: TurnoCelda) {
    if (!selectedWorker) return;
    assign(turno.id, selectedWorker);
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

  // ── Celda de turno (desktop, dentro de la tabla) ─────────────────────────
  function renderTurnoCellDesktop(turno?: TurnoCelda, label?: string, esDomingo?: boolean) {
    const domingoBlockedBySelection = esDomingo && selectedEsRestringidoDomingo;
    if (!turno) {
      return (
        <div className="flex min-h-[72px] items-center justify-center rounded-xl border-2 border-dashed"
          style={{ borderColor: domingoBlockedBySelection ? "#fde68a" : "var(--border)", background: domingoBlockedBySelection ? "#fffbeb" : "transparent" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sin turno</span>
        </div>
      );
    }
    const isHovered = hoveredTurnoId === turno.id;
    const isAM = label === "AM";
    return (
      <div
        className="min-h-[72px] rounded-xl border-2 border-dashed p-2.5 transition-all"
        style={{
          borderColor: domingoBlockedBySelection ? "#fde68a" : isHovered ? "#6366f1" : "var(--border)",
          background: domingoBlockedBySelection ? "#fffbeb" : isHovered ? "#eef2ff" : "transparent",
          cursor: selectedWorker ? "pointer" : "default",
        }}
        onDragOver={(e) => { e.preventDefault(); setHoveredTurnoId(turno.id); }}
        onDragEnter={(e) => { e.preventDefault(); setHoveredTurnoId(turno.id); }}
        onDragLeave={() => { if (hoveredTurnoId === turno.id) setHoveredTurnoId(null); }}
        onDrop={(e) => { e.preventDefault(); handleDrop(turno.id); }}
        onClick={() => handleTapSlot(turno)}
      >
        {turno.trabajadores.length === 0 ? (
          <div className="flex h-full min-h-[48px] flex-col items-center justify-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              stroke={isHovered || selectedWorker ? "#6366f1" : "#cbd5e1"}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-[11px]" style={{ color: isHovered || selectedWorker ? "#6366f1" : "var(--text-muted)" }}>
              {selectedWorker ? "Toca para asignar" : "Arrastra aquí"}
            </span>
          </div>
        ) : (
          <ul className="space-y-1">
            {turno.trabajadores.map((t, i) => (
              <li key={t.id} className="flex items-center justify-between gap-1.5 rounded-lg px-2 py-1"
                style={{ background: isAM ? "#eff6ff" : "#faf5ff" }}>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: `hsl(${(i * 67) % 360}, 55%, 55%)` }}>
                    {t.nombre.charAt(0)}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{t.nombre}</span>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(turno.id, t.id); }}
                  disabled={pending}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:bg-rose-100">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
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

  // ── Slot de turno (móvil, dentro de tarjeta de día) ───────────────────────
  function renderTurnoCellMobile(turno: TurnoCelda | undefined, label: string) {
    const isAM = label === "AM";
    const dotColor = isAM ? "bg-blue-400" : "bg-purple-400";
    const chipBg = isAM ? "#eff6ff" : "#faf5ff";
    const active = selectedWorker != null;

    return (
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
        </div>

        <div
          className="min-h-[64px] rounded-xl border-2 border-dashed p-2 transition-all"
          style={{
            borderColor: active && turno ? "#6366f1" : "var(--border)",
            background: active && turno ? "#eef2ff" : "transparent",
            cursor: active && turno ? "pointer" : "default",
          }}
          onClick={() => turno && handleTapSlot(turno)}
        >
          {!turno ? (
            <div className="flex h-full min-h-[44px] items-center justify-center">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sin turno</span>
            </div>
          ) : turno.trabajadores.length === 0 ? (
            <div className="flex h-full min-h-[44px] flex-col items-center justify-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                stroke={active ? "#6366f1" : "#cbd5e1"}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span className="text-[11px]" style={{ color: active ? "#6366f1" : "var(--text-muted)" }}>
                {active ? "Toca para asignar" : "Vacío"}
              </span>
            </div>
          ) : (
            <ul className="space-y-1">
              {turno.trabajadores.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5"
                  style={{ background: chipBg }}>
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: `hsl(${(i * 67) % 360}, 55%, 55%)` }}>
                      {t.nombre.charAt(0)}
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{t.nombre}</span>
                  </div>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(turno.id, t.id); }}
                    disabled={pending}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-rose-100">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const workerChips = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Trabajadores</span>
        {selectedWorker && (
          <button onClick={() => setSelectedWorker(null)}
            className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "#eef2ff", color: "#6366f1" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Cancelar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {trabajadores.map((t) => {
          const yaAsignado = trabajadoresAsignadosIds.has(t.id);
          const isSelected = selectedWorker?.id === t.id;
          const horas = horasPorTrabajador[t.id] ?? 0;
          const pct = Math.min(horas / limiteHoras, 1);
          const horasColor = pct >= 1 ? "#f43f5e" : pct >= 0.75 ? "#f59e0b" : "#10b981";
          const esDomingoRestringido = domingoRestringidoSet.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedWorker(isSelected ? null : t)}
              draggable
              onDragStart={() => { setDraggedWorker(t); setSelectedWorker(t); }}
              onDragEnd={() => { setDraggedWorker(null); setHoveredTurnoId(null); }}
              className="flex flex-col items-start gap-0.5 rounded-xl border px-3 py-1.5 text-xs font-medium select-none transition-all active:scale-95"
              style={{
                borderColor: isSelected ? "#6366f1" : yaAsignado ? "var(--border)" : "#c7d2fe",
                background: isSelected ? "#6366f1" : yaAsignado ? "#f8fafc" : "#eef2ff",
                color: isSelected ? "white" : yaAsignado ? "var(--text-muted)" : "var(--text-primary)",
                boxShadow: isSelected ? "0 0 0 3px #c7d2fe" : "none",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: isSelected ? "rgba(255,255,255,0.3)" : yaAsignado ? "#cbd5e1" : "#a5b4fc", color: "white" }}>
                  {t.nombre.charAt(0)}
                </span>
                {t.nombre.split(" ")[0]}
                {esDomingoRestringido && (
                  <span title="No puede trabajar el domingo (trabajó el domingo pasado)"
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                    style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "#fef3c7" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "white" : "#d97706"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                )}
                {yaAsignado && !isSelected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              {/* Barra de horas */}
              <div className="flex items-center gap-1.5 w-full">
                <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "#e2e8f0" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: isSelected ? "white" : horasColor }} />
                </div>
                <span className="text-[9px] font-medium tabular-nums" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : horasColor }}>
                  {horas}h/{limiteHoras}h
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {selectedWorker && (
        <p className="text-xs" style={{ color: "#6366f1" }}>
          Seleccionado: <strong>{selectedWorker.nombre}</strong> — toca un turno AM o PM para asignar
        </p>
      )}
      {selectedEsRestringidoDomingo && fechasDomingo.size > 0 && (
        <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[11px]"
          style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span><strong>{selectedWorker?.nombre.split(" ")[0]}</strong> trabajó el domingo pasado — no puede ser asignado al domingo de esta semana.</span>
        </div>
      )}
    </div>
  );

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

      {/* ── MÓVIL ────────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-4">
        {/* Chips de trabajadores */}
        <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {workerChips}
        </div>

        {/* Tarjetas por día */}
        {filas.length === 0 ? (
          <div className="rounded-2xl border py-12 text-center" style={{ borderColor: "var(--border)", borderStyle: "dashed" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Sin turnos generados</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Configura una sucursal primero</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filas.map((fila, i) => (
              <div key={fila.fecha} className="rounded-2xl border overflow-hidden"
                style={{
                  background: "var(--surface)",
                  borderColor: fechasDomingo.has(fila.fecha) && selectedEsRestringidoDomingo ? "#fde68a" : "var(--border)",
                }}>
                {/* Cabecera del día */}
                <div className="flex items-center justify-between border-b px-4 py-3"
                  style={{
                    borderColor: "var(--border)",
                    background: fechasDomingo.has(fila.fecha) && selectedEsRestringidoDomingo ? "#fffbeb" : i % 2 === 0 ? "#fafbff" : "var(--surface)",
                  }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold capitalize" style={{ color: "var(--text-primary)" }}>
                      {fila.nombreDia.split(" ")[0]}
                    </span>
                    <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {fila.nombreDia.split(" ").slice(1).join(" ")}
                    </span>
                    {fechasDomingo.has(fila.fecha) && selectedEsRestringidoDomingo && (
                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full" style={{ background: "#fef3c7" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {fila.propina != null && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: "#ecfdf5", color: "#059669" }}>
                      ${fila.propina.toLocaleString("es-CL")}
                    </span>
                  )}
                </div>

                <div className="p-3 space-y-3">
                  {/* AM y PM lado a lado */}
                  <div className="flex gap-2">
                    {renderTurnoCellMobile(fila.am, "AM")}
                    {renderTurnoCellMobile(fila.pm, "PM")}
                  </div>

                  {/* Propina del día */}
                  {mostrarPropinas && (
                    <form action={guardarPropinaDiaria} className="flex items-center gap-2">
                      <input type="hidden" name="fecha" value={fila.fecha} />
                      <input type="hidden" name="sucursal_id" value={fila.am?.sucursal_id ?? fila.pm?.sucursal_id ?? ""} />
                      <input type="hidden" name="semana_id" value={semanaId} />
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>$</span>
                        <input
                          type="number" name="monto_total" min="0" step="1"
                          defaultValue={fila.propina ?? ""}
                          placeholder="Propina del día"
                          required
                          className="w-full rounded-xl border py-2.5 pl-6 pr-3 text-sm outline-none focus:border-indigo-400"
                          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                        />
                      </div>
                      <button type="submit"
                        className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        Guardar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP ──────────────────────────────────────────────────── */}
      <div className="hidden lg:grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Panel lateral de trabajadores */}
        <aside className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {workerChips}
        </aside>

        {/* Tabla */}
        <section className="overflow-x-auto rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {filas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Sin turnos generados</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Configura una sucursal primero</p>
            </div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", background: "#fafbff" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Día</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />AM</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-400" />PM</span>
                  </th>
                  {mostrarPropinas && (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Propina</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={fila.fecha} className="border-b last:border-0 align-top"
                    style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "#fafbff" }}>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                          {fila.nombreDia.split(" ")[0]}
                        </p>
                        {fechasDomingo.has(fila.fecha) && selectedEsRestringidoDomingo && (
                          <span title="Trabajador con restricción de domingo" className="inline-flex items-center justify-center h-4 w-4 rounded-full" style={{ background: "#fef3c7" }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {fila.nombreDia.split(" ").slice(1).join(" ")}
                      </p>
                    </td>
                    <td className="px-4 py-4">{renderTurnoCellDesktop(fila.am, "AM", fechasDomingo.has(fila.fecha))}</td>
                    <td className="px-4 py-4">{renderTurnoCellDesktop(fila.pm, "PM", fechasDomingo.has(fila.fecha))}</td>
                    {mostrarPropinas && (
                      <td className="px-4 py-4 align-middle">
                        <form action={guardarPropinaDiaria} className="flex items-center gap-2">
                          <input type="hidden" name="fecha" value={fila.fecha} />
                          <input type="hidden" name="sucursal_id" value={fila.am?.sucursal_id ?? fila.pm?.sucursal_id ?? ""} />
                          <input type="hidden" name="semana_id" value={semanaId} />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>$</span>
                            <input type="number" name="monto_total" min="0" step="1"
                              defaultValue={fila.propina ?? ""} placeholder="0" required
                              className="w-28 rounded-xl border py-2 pl-6 pr-3 text-sm outline-none focus:border-indigo-400"
                              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
                          </div>
                          <button type="submit"
                            className="rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                            Guardar
                          </button>
                        </form>
                      </td>
                    )}
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
