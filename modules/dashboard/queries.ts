import { createAdminClient } from "@/lib/supabase/admin";

export async function getDashboardData(organizacion_id: string) {
  const admin = createAdminClient();
  const hoy = new Date();
  const anioMes = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  const fechaInicioMes = `${anioMes.anio}-${String(anioMes.mes).padStart(2, "0")}-01`;
  const fechaFinMes = new Date(anioMes.anio, anioMes.mes, 0).toISOString().split("T")[0];

  const [
    { data: semanas },
    { data: trabajadores },
    { data: semanasDelMes },
  ] = await Promise.all([
    admin
      .from("semanas")
      .select("id, estado, fecha_inicio, fecha_fin, creado_en")
      .eq("organizacion_id", organizacion_id)
      .order("fecha_inicio", { ascending: false })
      .limit(5),
    admin
      .from("trabajadores")
      .select("id, nombre, activo")
      .eq("organizacion_id", organizacion_id),
    admin
      .from("semanas")
      .select("id, fecha_inicio, fecha_fin")
      .eq("organizacion_id", organizacion_id)
      .lte("fecha_inicio", fechaFinMes)
      .gte("fecha_fin", fechaInicioMes),
  ]);

  const semanaActual = (semanas ?? []).find((s) => s.estado === "abierta") ?? semanas?.[0] ?? null;
  const totalActivos = (trabajadores ?? []).filter((t) => t.activo).length;
  const totalInactivos = (trabajadores ?? []).filter((t) => !t.activo).length;

  // Propinas de la última semana cerrada
  const ultimaCerrada = (semanas ?? []).find((s) => s.estado === "cerrada");
  let propinasUltimaSemana: { nombre: string; monto_total: number }[] = [];
  let totalUltimaSemana = 0;

  if (ultimaCerrada) {
    const { data: propinas } = await admin
      .from("propinas_calculadas")
      .select("monto_total, trabajador_id")
      .eq("semana_id", ultimaCerrada.id);

    const trabajadorIds = (propinas ?? []).map((p) => p.trabajador_id);
    const { data: nombresT } = trabajadorIds.length
      ? await admin.from("trabajadores").select("id, nombre").in("id", trabajadorIds)
      : { data: [] };

    const nombresMap = new Map((nombresT ?? []).map((t) => [t.id, t.nombre]));
    propinasUltimaSemana = (propinas ?? [])
      .map((p) => ({ nombre: nombresMap.get(p.trabajador_id) ?? "—", monto_total: Number(p.monto_total) }))
      .sort((a, b) => b.monto_total - a.monto_total)
      .slice(0, 5);
    totalUltimaSemana = (propinas ?? []).reduce((s, p) => s + Number(p.monto_total), 0);
  }

  // Horas del mes por trabajador
  const semanaIds = (semanasDelMes ?? []).map((s) => s.id);
  let horasMes: { nombre: string; horas: number; limite: number; excede: boolean }[] = [];

  if (semanaIds.length > 0 && (trabajadores ?? []).length > 0) {
    const { data: turnosDia } = await admin
      .from("turnos_dia")
      .select("id, semana_id")
      .in("semana_id", semanaIds);

    const turnoDiaIds = (turnosDia ?? []).map((t) => t.id);
    const { data: asignaciones } = turnoDiaIds.length
      ? await admin
          .from("asignaciones_turno")
          .select("trabajador_id, turno_dia_id")
          .in("turno_dia_id", turnoDiaIds)
          .eq("estado", "asistio")
      : { data: [] };

    const limiteMes = (semanasDelMes ?? []).length * 44;

    const conteo = new Map<string, number>();
    for (const a of asignaciones ?? []) {
      conteo.set(a.trabajador_id, (conteo.get(a.trabajador_id) ?? 0) + 1);
    }

    horasMes = (trabajadores ?? [])
      .filter((t) => t.activo)
      .map((t) => {
        const turnos = conteo.get(t.id) ?? 0;
        const horas = turnos * 8;
        return { nombre: t.nombre, horas, limite: limiteMes, excede: horas > limiteMes };
      })
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 6);
  }

  // Semana actual: turnos asignados
  let turnosAsignadosSemanaActual = 0;
  let propinasCargadasSemanaActual = 0;

  if (semanaActual) {
    const { data: tdActual } = await admin
      .from("turnos_dia")
      .select("id, fecha, sucursal_id")
      .eq("semana_id", semanaActual.id);

    const tdIds = (tdActual ?? []).map((t) => t.id);
    if (tdIds.length > 0) {
      const { count } = await admin
        .from("asignaciones_turno")
        .select("id", { count: "exact", head: true })
        .in("turno_dia_id", tdIds)
        .eq("estado", "asistio");
      turnosAsignadosSemanaActual = count ?? 0;
    }

    const fechas = [...new Set((tdActual ?? []).map((t) => t.fecha))];
    const sucursalIds = [...new Set((tdActual ?? []).map((t) => t.sucursal_id))];
    if (fechas.length && sucursalIds.length) {
      const { count } = await admin
        .from("propinas_diarias")
        .select("id", { count: "exact", head: true })
        .in("fecha", fechas)
        .in("sucursal_id", sucursalIds);
      propinasCargadasSemanaActual = count ?? 0;
    }
  }

  return {
    semanaActual,
    semanas: semanas ?? [],
    totalActivos,
    totalInactivos,
    ultimaCerrada,
    propinasUltimaSemana,
    totalUltimaSemana,
    horasMes,
    turnosAsignadosSemanaActual,
    propinasCargadasSemanaActual,
    mesActual: anioMes,
  };
}
