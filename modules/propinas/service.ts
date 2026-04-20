import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoTrabajador = {
  trabajador_id: string;
  nombre: string;
  total_participaciones: number;
  monto_total: number;
};

export async function calcularPropinasSemana(semanaId: string): Promise<ResultadoTrabajador[]> {
  const supabase = createAdminClient();

  const { data: turnosSemana, error: errorTurnos } = await supabase
    .from("turnos_dia")
    .select("id, fecha, sucursal_id")
    .eq("semana_id", semanaId);

  if (errorTurnos) {
    throw new Error("Error obteniendo turnos de la semana");
  }

  if (!turnosSemana || turnosSemana.length === 0) {
    return [];
  }

  const turnosPorFecha = new Map<string, { turnoIds: string[]; sucursalId: string }>();

  for (const turno of turnosSemana) {
    const actual = turnosPorFecha.get(turno.fecha);
    if (!actual) {
      turnosPorFecha.set(turno.fecha, { turnoIds: [turno.id], sucursalId: turno.sucursal_id });
    } else {
      actual.turnoIds.push(turno.id);
    }
  }

  const resultadoMap = new Map<string, ResultadoTrabajador>();

  for (const [fecha, infoDia] of turnosPorFecha.entries()) {
    const { data: propinaDia } = await supabase
      .from("propinas_diarias")
      .select("monto_total")
      .eq("fecha", fecha)
      .eq("sucursal_id", infoDia.sucursalId)
      .maybeSingle();

    if (!propinaDia) continue;

    const montoDia = Number(propinaDia.monto_total);

    const { data: asignaciones } = await supabase
      .from("asignaciones_turno")
      .select("trabajador_id, turno_dia_id")
      .eq("estado", "asistio")
      .in("turno_dia_id", infoDia.turnoIds);

    if (!asignaciones || asignaciones.length === 0) continue;

    const trabajadorIds = [...new Set(asignaciones.map((a) => a.trabajador_id))];

    const { data: trabajadores } = await supabase
      .from("trabajadores")
      .select("id, nombre")
      .in("id", trabajadorIds);

    const nombresMap = new Map<string, string>();
    for (const t of trabajadores ?? []) {
      nombresMap.set(t.id, t.nombre);
    }

    const participacionesMap = new Map<string, number>();
    for (const a of asignaciones) {
      participacionesMap.set(a.trabajador_id, (participacionesMap.get(a.trabajador_id) ?? 0) + 1);
    }

    const totalParticipaciones = Array.from(participacionesMap.values()).reduce((a, b) => a + b, 0);
    if (totalParticipaciones === 0) continue;

    const valorParticipacion = montoDia / totalParticipaciones;

    for (const [id, participaciones] of participacionesMap.entries()) {
      const nombre = nombresMap.get(id) ?? "Sin nombre";
      const monto = participaciones * valorParticipacion;

      if (!resultadoMap.has(id)) {
        resultadoMap.set(id, { trabajador_id: id, nombre, total_participaciones: 0, monto_total: 0 });
      }

      const actual = resultadoMap.get(id)!;
      actual.total_participaciones += participaciones;
      actual.monto_total += monto;
    }
  }

  return Array.from(resultadoMap.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );
}
