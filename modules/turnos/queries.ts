import { createClient } from "@/lib/supabase/server";

export type AsignacionGrilla = {
  id: string;
  fecha: string;
  sucursal_id: string;
  turno_codigo: string;
  trabajadores: {
    id: string;
    nombre: string;
  }[];
  propina_dia: number | null;
};

export async function getGrillaSemana(semanaId: string): Promise<AsignacionGrilla[]> {
  const supabase = await createClient();

  const { data: turnosDia, error } = await supabase
    .from("turnos_dia")
    .select("id, fecha, sucursal_id, turno_id")
    .eq("semana_id", semanaId)
    .order("fecha", { ascending: true });

  if (error) {
    throw new Error(`No se pudo obtener la semana: ${error.message}`);
  }

  if (!turnosDia || turnosDia.length === 0) {
    return [];
  }

  const turnoIds = [...new Set(turnosDia.map((t) => t.turno_id))];
  const turnoDiaIds = turnosDia.map((t) => t.id);
  const fechas = [...new Set(turnosDia.map((t) => t.fecha))];
  const sucursalIds = [...new Set(turnosDia.map((t) => t.sucursal_id))];

  const { data: turnos } = turnoIds.length
    ? await supabase.from("turnos").select("id, codigo").in("id", turnoIds)
    : { data: [] };

  const turnosMap = new Map<string, string>();
  for (const turno of turnos ?? []) {
    turnosMap.set(turno.id, turno.codigo);
  }

  const { data: asignaciones } = turnoDiaIds.length
    ? await supabase
        .from("asignaciones_turno")
        .select("turno_dia_id, trabajador_id, estado")
        .in("turno_dia_id", turnoDiaIds)
    : { data: [] };

  const trabajadorIds = [
    ...new Set((asignaciones ?? []).map((a) => a.trabajador_id)),
  ];

  const { data: trabajadores } = trabajadorIds.length
    ? await supabase.from("trabajadores").select("id, nombre").in("id", trabajadorIds)
    : { data: [] };

  const trabajadoresMap = new Map<string, string>();
  for (const t of trabajadores ?? []) {
    trabajadoresMap.set(t.id, t.nombre);
  }

  const { data: propinas } =
    fechas.length && sucursalIds.length
      ? await supabase
          .from("propinas_diarias")
          .select("fecha, sucursal_id, monto_total")
          .in("fecha", fechas)
          .in("sucursal_id", sucursalIds)
      : { data: [] };

  return turnosDia.map((turno) => {
    const trabajadoresAsignados = (asignaciones ?? [])
      .filter((a) => a.turno_dia_id === turno.id && a.estado === "asistio")
      .map((a) => ({
        id: a.trabajador_id,
        nombre: trabajadoresMap.get(a.trabajador_id) ?? "Sin nombre",
      }));

    const propinaDia =
      (propinas ?? []).find(
        (p) => p.fecha === turno.fecha && p.sucursal_id === turno.sucursal_id
      )?.monto_total ?? null;

    return {
      id: turno.id,
      fecha: turno.fecha,
      sucursal_id: turno.sucursal_id,
      turno_codigo: (turnosMap.get(turno.turno_id) ?? "SIN_TURNO").trim().toUpperCase(),
      trabajadores: trabajadoresAsignados,
      propina_dia: propinaDia ? Number(propinaDia) : null,
    };
  });
}

export async function getSemanas() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("semanas")
    .select("id, estado, creado_en, fecha_inicio, fecha_fin")
    .order("fecha_inicio", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron obtener las semanas: ${error.message}`);
  }

  return data ?? [];
}
