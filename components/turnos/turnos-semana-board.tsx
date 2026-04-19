"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  asignarTrabajadorATurno,
  quitarTrabajadorDeTurno,
  guardarPropinaDiaria,
} from "@/modules/turnos/actions";

type Trabajador = {
  id: string;
  nombre: string;
};

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
        await asignarTrabajadorATurno(formData);
        router.refresh();
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
      await quitarTrabajadorDeTurno(formData);
      router.refresh();
    });
  }

  function renderTurnoCell(turno?: TurnoCelda) {
    if (!turno) {
      return <span className="text-sm text-gray-400">Sin turno</span>;
    }

    const isHovered = hoveredTurnoId === turno.id;

    return (
      <div
        className={[
          "space-y-2 rounded-md border border-dashed p-3 min-h-[100px] transition",
          isHovered ? "border-black bg-gray-50" : "border-transparent",
        ].join(" ")}
        onDragOver={(e) => { e.preventDefault(); setHoveredTurnoId(turno.id); }}
        onDragEnter={(e) => { e.preventDefault(); setHoveredTurnoId(turno.id); }}
        onDragLeave={() => { if (hoveredTurnoId === turno.id) setHoveredTurnoId(null); }}
        onDrop={(e) => { e.preventDefault(); handleDrop(turno.id); }}
      >
        {turno.trabajadores.length ? (
          <ul className="space-y-1 text-sm">
            {turno.trabajadores.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded bg-gray-100 px-2 py-1"
              >
                <span>{t.nombre}</span>
                <button
                  type="button"
                  className="text-xs font-bold text-red-500 hover:text-red-700"
                  title="Quitar trabajador"
                  onClick={() => handleRemove(turno.id, t.id)}
                  disabled={pending}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-gray-400">Arrastra aqui</span>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-xl border p-4">
        <h2 className="font-semibold">Trabajadores activos</h2>
        <p className="mt-1 text-xs text-gray-500">Arrastra hacia AM o PM.</p>

        <ul className="mt-4 space-y-2">
          {trabajadores.map((t) => {
            const yaAsignado = trabajadoresAsignadosIds.has(t.id);
            return (
              <li
                key={t.id}
                draggable
                onDragStart={() => setDraggedWorker(t)}
                onDragEnd={() => { setDraggedWorker(null); setHoveredTurnoId(null); }}
                className={[
                  "cursor-grab rounded-lg border px-3 py-2 text-sm shadow-sm select-none",
                  yaAsignado ? "bg-gray-50 text-gray-500" : "bg-white",
                ].join(" ")}
              >
                {t.nombre}
                {yaAsignado && <span className="ml-1 text-xs text-gray-400">(asignado)</span>}
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="overflow-x-auto rounded-xl border">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm">
              <th className="p-4 font-medium">Dia</th>
              <th className="p-4 font-medium">Turno AM</th>
              <th className="p-4 font-medium">Turno PM</th>
              <th className="p-4 font-medium">Propina diaria</th>
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => (
              <tr key={fila.fecha} className="border-b align-top">
                <td className="p-4 font-medium text-sm">{fila.nombreDia}</td>
                <td className="p-4">{renderTurnoCell(fila.am)}</td>
                <td className="p-4">{renderTurnoCell(fila.pm)}</td>
                <td className="p-4">
                  <form action={guardarPropinaDiaria} className="flex items-center gap-2">
                    <input type="hidden" name="fecha" value={fila.fecha} />
                    <input type="hidden" name="sucursal_id" value={fila.am?.sucursal_id ?? fila.pm?.sucursal_id ?? ""} />
                    <input type="hidden" name="semana_id" value={semanaId} />
                    <input
                      type="number"
                      name="monto_total"
                      min="0"
                      step="0.01"
                      defaultValue={fila.propina ?? ""}
                      className="w-28 rounded border px-2 py-1 text-sm"
                      placeholder="0"
                      required
                    />
                    <button
                      type="submit"
                      className="rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800"
                    >
                      Guardar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
