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
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [pendingWorkerId, setPendingWorkerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const domingoRestringidoSet = useMemo(() => new Set(domingoRestringidoIds), [domingoRestringidoIds]);
  const fechasDomingo = useMemo(
    () => new Set(filas.filter((f) => new Date(f.fecha + "T12:00:00").getDay() === 0).map((f) => f.fecha)),
    [filas]
  );

  // selectedSlot se deriva de props → se actualiza automáticamente tras router.refresh()
  const allTurnos = useMemo(
    () => filas.flatMap((f) => [f.am, f.pm]).filter(Boolean) as TurnoCelda[],
    [filas]
  );
  const selectedSlot = selectedSlotId ? (allTurnos.find((t) => t.id === selectedSlotId) ?? null) : null;
  const selectedFila = selectedSlotId
    ? filas.find((f) => f.am?.id === selectedSlotId || f.pm?.id === selectedSlotId)
    : null;
  const selectedIsAM = selectedFila?.am?.id === selectedSlotId;
  const esDomingoSeleccionado = selectedFila ? fechasDomingo.has(selectedFila.fecha) : false;

  function toggleWorker(worker: Trabajador) {
    if (!selectedSlot || pendingWorkerId) return;
    const estaAsignado = selectedSlot.trabajadores.some((t) => t.id === worker.id);
    const formData = new FormData();
    formData.set("turno_dia_id", selectedSlot.id);
    formData.set("trabajador_id", worker.id);
    formData.set("semana_id", semanaId);

    setPendingWorkerId(worker.id);
    startTransition(async () => {
      try {
        setError(null);
        if (estaAsignado) {
          await quitarTrabajadorDeTurno(formData);
        } else {
          await asignarTrabajadorATurno(formData);
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al actualizar turno");
      } finally {
        setPendingWorkerId(null);
      }
    });
  }

  // ── Lista de trabajadores como checklist (compartida desktop/móvil) ────────
  function renderListaTrabajadores() {
    if (!selectedSlot) return null;
    return (
      <>
        {trabajadores.length === 0 && (
          <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            No hay trabajadores activos
          </p>
        )}
        {trabajadores.map((t) => {
          const estaAsignado = selectedSlot.trabajadores.some((w) => w.id === t.id);
          const isPending = pendingWorkerId === t.id;
          const horas = horasPorTrabajador[t.id] ?? 0;
          const pct = Math.min(horas / limiteHoras, 1);
          const horasColor = pct >= 1 ? "#f43f5e" : pct >= 0.75 ? "#f59e0b" : "#10b981";
          const esDomingoRestringido = esDomingoSeleccionado && domingoRestringidoSet.has(t.id);
          const deshabilitado = isPending || (esDomingoRestringido && !estaAsignado);

          return (
            <button
              key={t.id}
              type="button"
              disabled={deshabilitado}
              onClick={() => toggleWorker(t)}
              className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]"
              style={{
                borderColor: estaAsignado ? "#6366f1" : "var(--border)",
                background: estaAsignado ? "#eef2ff" : esDomingoRestringido ? "#fffbeb" : "var(--surface)",
                opacity: deshabilitado && !estaAsignado ? 0.5 : 1,
                cursor: deshabilitado && !estaAsignado ? "not-allowed" : "pointer",
              }}
            >
              {/* Checkbox */}
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all"
                style={{
                  borderColor: estaAsignado ? "#6366f1" : "#cbd5e1",
                  background: estaAsignado ? "#6366f1" : "transparent",
                }}
              >
                {isPending ? (
                  <div
                    className="h-2.5 w-2.5 animate-spin rounded-full border border-t-transparent"
                    style={{ borderColor: estaAsignado ? "white" : "#6366f1", borderTopColor: "transparent" }}
                  />
                ) : estaAsignado ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : null}
              </div>

              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: estaAsignado ? "#6366f1" : "#94a3b8" }}
              >
                {t.nombre.charAt(0)}
              </div>

              {/* Nombre + barra horas */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {t.nombre}
                  </span>
                  {esDomingoRestringido && (
                    <span
                      title="Trabajó el domingo pasado — no puede trabajar este domingo"
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "#fef3c7" }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: horasColor }} />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums shrink-0" style={{ color: horasColor }}>
                    {horas}h/{limiteHoras}h
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </>
    );
  }

  // ── Celda desktop: compacta o expandida con checklist ─────────────────────
  function renderCeldaDesktop(turno?: TurnoCelda, label?: string, esDomingo?: boolean) {
    if (!turno) {
      return (
        <div
          className="flex min-h-[72px] items-center justify-center rounded-xl border-2 border-dashed"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sin turno</span>
        </div>
      );
    }

    const isAM = label === "AM";
    const isSelected = selectedSlotId === turno.id;
    const chipBg = isAM ? "#eff6ff" : "#faf5ff";

    if (isSelected) {
      return (
        <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: "#6366f1" }}>
          {/* Cabecera checklist */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ background: "#f0f4ff", borderColor: "#c7d2fe" }}
          >
            <span className="text-xs font-semibold" style={{ color: "#6366f1" }}>
              Asignar personas
            </span>
            <button
              type="button"
              onClick={() => { setSelectedSlotId(null); setError(null); }}
              className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-indigo-100"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Lista con scroll */}
          <div className="max-h-56 overflow-y-auto p-2 space-y-1" style={{ background: "var(--surface)" }}>
            {renderListaTrabajadores()}
          </div>

          {error && (
            <div
              className="flex items-center gap-1.5 border-t px-3 py-2 text-xs"
              style={{ background: "#fff1f2", borderColor: "#fecdd3", color: "#f43f5e" }}
            >
              {error}
            </div>
          )}
        </div>
      );
    }

    // Vista compacta
    return (
      <button
        type="button"
        onClick={() => setSelectedSlotId(turno.id)}
        className="group w-full min-h-[72px] rounded-xl border-2 p-2.5 text-left transition-all"
        style={{
          borderColor: esDomingo ? "#fde68a" : "var(--border)",
          background: esDomingo ? "#fffbeb" : "transparent",
          borderStyle: turno.trabajadores.length === 0 ? "dashed" : "solid",
          cursor: "pointer",
        }}
      >
        {turno.trabajadores.length === 0 ? (
          <div className="flex h-full min-h-[48px] flex-col items-center justify-center gap-1">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              stroke="#cbd5e1" className="group-hover:stroke-indigo-400 transition-colors"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-[11px] group-hover:text-indigo-400 transition-colors" style={{ color: "var(--text-muted)" }}>
              Asignar personas
            </span>
          </div>
        ) : (
          <ul className="space-y-1">
            {turno.trabajadores.map((t, i) => (
              <li key={t.id} className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: chipBg }}>
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: `hsl(${(i * 67) % 360}, 55%, 55%)` }}
                >
                  {t.nombre.charAt(0)}
                </div>
                <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.nombre}</span>
              </li>
            ))}
          </ul>
        )}
      </button>
    );
  }

  // ── Botón compacto de turno (móvil) ───────────────────────────────────────
  function renderBotonMobile(turno: TurnoCelda | undefined, label: string) {
    const isAM = label === "AM";
    const dotColor = isAM ? "bg-blue-400" : "bg-purple-400";
    const chipBg = isAM ? "#eff6ff" : "#faf5ff";
    const isSelected = selectedSlotId === turno?.id;

    return (
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
        </div>

        {!turno ? (
          <div
            className="flex min-h-[52px] items-center justify-center rounded-xl border-2 border-dashed"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sin turno</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSelectedSlotId(isSelected ? null : turno.id)}
            className="group w-full min-h-[52px] rounded-xl border-2 p-2 text-left transition-all active:scale-[0.98]"
            style={{
              borderColor: isSelected ? "#6366f1" : "var(--border)",
              background: isSelected ? "#eef2ff" : "transparent",
              borderStyle: turno.trabajadores.length === 0 ? "dashed" : "solid",
            }}
          >
            {turno.trabajadores.length === 0 ? (
              <div className="flex h-full min-h-[36px] flex-col items-center justify-center gap-1">
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  stroke={isSelected ? "#6366f1" : "#cbd5e1"} className="group-hover:stroke-indigo-400 transition-colors"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span
                  className="text-[10px] group-hover:text-indigo-400 transition-colors"
                  style={{ color: isSelected ? "#6366f1" : "var(--text-muted)" }}
                >
                  Tocar para asignar
                </span>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {turno.trabajadores.map((t, i) => (
                  <li key={t.id} className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5" style={{ background: chipBg }}>
                    <div
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: `hsl(${(i * 67) % 360}, 55%, 55%)` }}
                    >
                      {t.nombre.charAt(0)}
                    </div>
                    <span className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {t.nombre.split(" ")[0]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error global (sin slot abierto) */}
      {error && !selectedSlot && (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ background: "#fff1f2", borderColor: "#fecdd3", color: "#f43f5e" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ── MÓVIL ────────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {filas.length === 0 ? (
          <div
            className="rounded-2xl border py-12 text-center"
            style={{ borderColor: "var(--border)", borderStyle: "dashed" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Sin turnos generados</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Configura una sucursal primero</p>
          </div>
        ) : (
          filas.map((fila, i) => {
            const slotAbierto =
              fila.am?.id === selectedSlotId ? fila.am
              : fila.pm?.id === selectedSlotId ? fila.pm
              : null;
            const labelAbierto = fila.am?.id === selectedSlotId ? "AM" : "PM";
            const dotAbierto = labelAbierto === "AM" ? "bg-blue-400" : "bg-purple-400";

            return (
              <div
                key={fila.fecha}
                className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                {/* Cabecera día */}
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{
                    borderColor: "var(--border)",
                    background: i % 2 === 0 ? "#fafbff" : "var(--surface)",
                  }}
                >
                  <div>
                    <span className="text-sm font-bold capitalize" style={{ color: "var(--text-primary)" }}>
                      {fila.nombreDia.split(" ")[0]}
                    </span>
                    <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {fila.nombreDia.split(" ").slice(1).join(" ")}
                    </span>
                  </div>
                  {fila.propina != null && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: "#ecfdf5", color: "#059669" }}
                    >
                      ${fila.propina.toLocaleString("es-CL")}
                    </span>
                  )}
                </div>

                <div className="p-3 space-y-3">
                  {/* Botones AM y PM compactos */}
                  <div className="flex gap-2">
                    {renderBotonMobile(fila.am, "AM")}
                    {renderBotonMobile(fila.pm, "PM")}
                  </div>

                  {/* Checklist inline — aparece solo en este día */}
                  {slotAbierto && (
                    <div
                      className="rounded-xl border-2 overflow-hidden"
                      style={{ borderColor: "#6366f1" }}
                    >
                      {/* Cabecera del checklist */}
                      <div
                        className="flex items-center justify-between px-3 py-2.5 border-b"
                        style={{ background: "#f0f4ff", borderColor: "#c7d2fe" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${dotAbierto}`} />
                          <span className="text-xs font-semibold" style={{ color: "#4f46e5" }}>
                            Turno {labelAbierto} · {fila.nombreDia.split(" ")[0]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedSlotId(null); setError(null); }}
                          className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-indigo-100"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>

                      {/* Lista de trabajadores */}
                      <div className="p-2 space-y-1.5 max-h-60 overflow-y-auto" style={{ background: "var(--surface)" }}>
                        {renderListaTrabajadores()}
                      </div>

                      {error && (
                        <div
                          className="flex items-center gap-1.5 border-t px-3 py-2 text-xs"
                          style={{ background: "#fff1f2", borderColor: "#fecdd3", color: "#f43f5e" }}
                        >
                          {error}
                        </div>
                      )}
                    </div>
                  )}

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
                          defaultValue={fila.propina ?? ""} placeholder="Propina del día" required
                          className="w-full rounded-xl border py-2.5 pl-6 pr-3 text-sm outline-none focus:border-indigo-400"
                          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      >
                        Guardar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── DESKTOP ──────────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <section
          className="overflow-x-auto rounded-2xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
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
                  <tr
                    key={fila.fecha}
                    className="border-b last:border-0 align-top"
                    style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "#fafbff" }}
                  >
                    <td className="px-4 py-4 align-middle">
                      <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                        {fila.nombreDia.split(" ")[0]}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {fila.nombreDia.split(" ").slice(1).join(" ")}
                      </p>
                    </td>
                    <td className="px-4 py-4">{renderCeldaDesktop(fila.am, "AM", fechasDomingo.has(fila.fecha))}</td>
                    <td className="px-4 py-4">{renderCeldaDesktop(fila.pm, "PM", fechasDomingo.has(fila.fecha))}</td>
                    {mostrarPropinas && (
                      <td className="px-4 py-4 align-middle">
                        <form action={guardarPropinaDiaria} className="flex items-center gap-2">
                          <input type="hidden" name="fecha" value={fila.fecha} />
                          <input type="hidden" name="sucursal_id" value={fila.am?.sucursal_id ?? fila.pm?.sucursal_id ?? ""} />
                          <input type="hidden" name="semana_id" value={semanaId} />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>$</span>
                            <input
                              type="number" name="monto_total" min="0" step="1"
                              defaultValue={fila.propina ?? ""} placeholder="0" required
                              className="w-28 rounded-xl border py-2 pl-6 pr-3 text-sm outline-none focus:border-indigo-400"
                              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
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
