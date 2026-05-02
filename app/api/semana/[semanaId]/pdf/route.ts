import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import HorarioSemanalPDF from "@/components/pdf/horario-semanal-pdf";

function getNombreDia(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/semana/[semanaId]/pdf">
) {
  const { semanaId } = await ctx.params;
  const admin = createAdminClient();

  // Semana + organización
  const { data: semana } = await admin
    .from("semanas")
    .select("id, fecha_inicio, fecha_fin, organizacion_id")
    .eq("id", semanaId)
    .single();

  if (!semana) return new Response("Not found", { status: 404 });

  const { data: org } = await admin
    .from("organizaciones")
    .select("nombre")
    .eq("id", semana.organizacion_id)
    .single();

  // Turnos del día para la semana
  const { data: turnosDia } = await admin
    .from("turnos_dia")
    .select("id, fecha, turno_id")
    .eq("semana_id", semanaId)
    .order("fecha", { ascending: true });

  if (!turnosDia || turnosDia.length === 0) {
    return new Response("Sin turnos", { status: 404 });
  }

  const turnoIds = [...new Set(turnosDia.map((t) => t.turno_id))];
  const turnoDiaIds = turnosDia.map((t) => t.id);

  // Catálogo de turnos (AM/PM)
  const { data: turnos } = await admin
    .from("turnos")
    .select("id, codigo")
    .in("id", turnoIds);

  const turnosMap = new Map((turnos ?? []).map((t) => [t.id, t.codigo]));

  // Asignaciones
  const { data: asignaciones } = await admin
    .from("asignaciones_turno")
    .select("turno_dia_id, trabajador_id")
    .in("turno_dia_id", turnoDiaIds)
    .eq("estado", "asistio");

  const trabajadorIds = [...new Set((asignaciones ?? []).map((a) => a.trabajador_id))];

  const { data: trabajadores } = trabajadorIds.length
    ? await admin.from("trabajadores").select("id, nombre").in("id", trabajadorIds)
    : { data: [] };

  const trabajadoresMap = new Map((trabajadores ?? []).map((t) => [t.id, t.nombre]));

  // Agrupar por fecha → AM / PM
  const fechas = [...new Set(turnosDia.map((t) => t.fecha))];

  const filas = fechas.map((fecha) => {
    const turnosDiaFecha = turnosDia.filter((t) => t.fecha === fecha);

    const trabajadoresDe = (codigo: string) => {
      const td = turnosDiaFecha.find(
        (t) => (turnosMap.get(t.turno_id) ?? "").toUpperCase() === codigo
      );
      if (!td) return [];
      return (asignaciones ?? [])
        .filter((a) => a.turno_dia_id === td.id)
        .map((a) => ({ id: a.trabajador_id, nombre: trabajadoresMap.get(a.trabajador_id) ?? "" }));
    };

    return {
      fecha,
      nombreDia: getNombreDia(fecha),
      am: trabajadoresDe("AM"),
      pm: trabajadoresDe("PM"),
    };
  });

  // Generar PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(HorarioSemanalPDF as any, {
    orgNombre: org?.nombre ?? "",
    fechaInicio: semana.fecha_inicio,
    fechaFin: semana.fecha_fin,
    filas,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="horario-${semana.fecha_inicio}.pdf"`,
    },
  });
}
