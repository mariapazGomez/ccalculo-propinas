"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/modules/admin/queries";

export async function eliminarSemana(formData: FormData) {
  await getAdminContext(); // verifica que sea admin con organización
  const admin = createAdminClient();
  const semana_id = String(formData.get("semana_id") ?? "");
  if (!semana_id) throw new Error("ID requerido");

  // Eliminar en cascada: propinas_calculadas, asignaciones_turno, turnos_dia, propinas_diarias
  const { data: turnosDia } = await admin
    .from("turnos_dia")
    .select("id")
    .eq("semana_id", semana_id);

  const turnosDiaIds = (turnosDia ?? []).map((t) => t.id);

  if (turnosDiaIds.length > 0) {
    await admin.from("asignaciones_turno").delete().in("turno_dia_id", turnosDiaIds);
  }

  await admin.from("propinas_calculadas").delete().eq("semana_id", semana_id);
  await admin.from("turnos_dia").delete().eq("semana_id", semana_id);

  const { error } = await admin.from("semanas").delete().eq("id", semana_id);
  if (error) throw new Error(`Error eliminando semana: ${error.message}`);

  revalidatePath("/semana");
}

export async function crearSemana(formData: FormData) {
  const { organizacion_id } = await getAdminContext();
  if (!organizacion_id) throw new Error("Sin organización");

  const fecha_inicio = String(formData.get("fecha_inicio") ?? "").trim();
  const fecha_fin = String(formData.get("fecha_fin") ?? "").trim();

  if (!fecha_inicio || !fecha_fin) throw new Error("Fechas requeridas");
  if (fecha_fin < fecha_inicio) throw new Error("La fecha fin debe ser posterior a la fecha inicio");

  const admin = createAdminClient();

  const { data: semana, error } = await admin
    .from("semanas")
    .insert({ organizacion_id, fecha_inicio, fecha_fin, estado: "abierta" })
    .select("id")
    .single();

  if (error) throw new Error(`Error creando semana: ${error.message}`);

  // Ensure AM and PM shift codes exist (global, no org FK)
  const { data: turnosExistentes } = await admin.from("turnos").select("codigo");
  const codigosExistentes = new Set((turnosExistentes ?? []).map((t) => t.codigo));
  const codigosFaltantes = (["AM", "PM"] as const).filter((c) => !codigosExistentes.has(c));
  if (codigosFaltantes.length > 0) {
    await admin.from("turnos").insert(codigosFaltantes.map((codigo) => ({ codigo })));
  }

  const { data: sucursales } = await admin
    .from("sucursales")
    .select("id")
    .eq("organizacion_id", organizacion_id);

  if (!sucursales || sucursales.length === 0) {
    throw new Error("No hay sucursales registradas. Ve a Admin → Sucursales y crea al menos una.");
  }

  for (const sucursal of sucursales) {
    await admin.rpc("generar_turnos_semana", {
      p_fecha_inicio: fecha_inicio,
      p_semana_id: semana.id,
      p_sucursal_id: sucursal.id,
    });
  }

  revalidatePath("/semana");
  redirect(`/semana/${semana.id}`);
}
