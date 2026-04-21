import { createAdminClient } from "@/lib/supabase/admin";

export type ResumenHorasTrabajador = {
  trabajador_id: string;
  nombre: string;
  turnosPorSemana: {
    semana_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    turnos: number;
    horas: number;
    limite_horas: number;
    excede: boolean;
  }[];
  total_turnos: number;
  total_horas: number;
  limite_horas_mes: number;
  horas_disponibles: number;
};

export async function getResumenHorasMes(
  organizacion_id: string,
  anio: number,
  mes: number // 1-12
): Promise<ResumenHorasTrabajador[]> {
  const admin = createAdminClient();

  const fechaInicioMes = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const fechaFinMes = new Date(anio, mes, 0).toISOString().split("T")[0]; // último día del mes

  // Semanas que se solapan con el mes seleccionado
  const { data: semanas } = await admin
    .from("semanas")
    .select("id, fecha_inicio, fecha_fin")
    .eq("organizacion_id", organizacion_id)
    .lte("fecha_inicio", fechaFinMes)
    .gte("fecha_fin", fechaInicioMes)
    .order("fecha_inicio");

  if (!semanas || semanas.length === 0) return [];

  // Trabajadores activos de la organización
  const { data: trabajadores } = await admin
    .from("trabajadores")
    .select("id, nombre")
    .eq("organizacion_id", organizacion_id)
    .eq("activo", true)
    .order("nombre");

  if (!trabajadores || trabajadores.length === 0) return [];

  const semanaIds = semanas.map((s) => s.id);

  // Todos los turnos_dia de esas semanas
  const { data: turnosDia } = await admin
    .from("turnos_dia")
    .select("id, semana_id, fecha")
    .in("semana_id", semanaIds);

  if (!turnosDia || turnosDia.length === 0) return [];

  const turnoDiaIds = turnosDia.map((t) => t.id);

  // Asignaciones con estado "asistio"
  const { data: asignaciones } = await admin
    .from("asignaciones_turno")
    .select("trabajador_id, turno_dia_id")
    .in("turno_dia_id", turnoDiaIds)
    .eq("estado", "asistio");

  // Mapa turno_dia_id → semana_id
  const turnoSemanaMap = new Map<string, string>();
  for (const td of turnosDia) turnoSemanaMap.set(td.id, td.semana_id);

  // Semanas que caen dentro del mes (para el límite mensual)
  // Una semana cuenta si su inicio o fin está dentro del mes
  const semanasDentroDelMes = semanas.filter(
    (s) => s.fecha_inicio <= fechaFinMes && s.fecha_fin >= fechaInicioMes
  );
  const HORAS_POR_TURNO = 8;
  const LIMITE_HORAS_SEMANA = 44;
  const limiteMensual = semanasDentroDelMes.length * LIMITE_HORAS_SEMANA;

  return trabajadores.map((trabajador) => {
    const asignacionesTrabajador = (asignaciones ?? []).filter(
      (a) => a.trabajador_id === trabajador.id
    );

    // Agrupar por semana
    const porSemana = new Map<string, number>();
    for (const a of asignacionesTrabajador) {
      const semanaId = turnoSemanaMap.get(a.turno_dia_id);
      if (!semanaId) continue;
      porSemana.set(semanaId, (porSemana.get(semanaId) ?? 0) + 1);
    }

    const turnosPorSemana = semanas.map((s) => {
      const turnos = porSemana.get(s.id) ?? 0;
      const horas = turnos * HORAS_POR_TURNO;
      return {
        semana_id: s.id,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin,
        turnos,
        horas,
        limite_horas: LIMITE_HORAS_SEMANA,
        excede: horas > LIMITE_HORAS_SEMANA,
      };
    });

    const total_turnos = asignacionesTrabajador.length;
    const total_horas = total_turnos * HORAS_POR_TURNO;
    const horas_disponibles = Math.max(0, limiteMensual - total_horas);

    return {
      trabajador_id: trabajador.id,
      nombre: trabajador.nombre,
      turnosPorSemana,
      total_turnos,
      total_horas,
      limite_horas_mes: limiteMensual,
      horas_disponibles,
    };
  });
}
