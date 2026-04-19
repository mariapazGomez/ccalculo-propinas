"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function asignarTrabajadorATurno(formData: FormData) {
  const supabase = await createClient();

  const turno_dia_id = String(formData.get("turno_dia_id") ?? "");
  const trabajador_id = String(formData.get("trabajador_id") ?? "");
  const semana_id = String(formData.get("semana_id") ?? "");

  if (!turno_dia_id || !trabajador_id || !semana_id) {
    throw new Error("Faltan datos");
  }

  const { data: existente, error: errorBusqueda } = await supabase
    .from("asignaciones_turno")
    .select("id")
    .eq("turno_dia_id", turno_dia_id)
    .eq("trabajador_id", trabajador_id)
    .maybeSingle();

  if (errorBusqueda) {
    throw new Error(`Error validando asignacion: ${errorBusqueda.message}`);
  }

  if (!existente) {
    const { error } = await supabase.from("asignaciones_turno").insert({
      turno_dia_id,
      trabajador_id,
      estado: "asistio",
    });

    if (error) {
      throw new Error(`Error al asignar trabajador: ${error.message}`);
    }
  }

  revalidatePath(`/semana/${semana_id}`, "page");
}

export async function quitarTrabajadorDeTurno(formData: FormData) {
  const supabase = await createClient();

  const turno_dia_id = String(formData.get("turno_dia_id") ?? "");
  const trabajador_id = String(formData.get("trabajador_id") ?? "");
  const semana_id = String(formData.get("semana_id") ?? "");

  if (!turno_dia_id || !trabajador_id || !semana_id) {
    throw new Error("Faltan datos");
  }

  const { error } = await supabase
    .from("asignaciones_turno")
    .delete()
    .eq("turno_dia_id", turno_dia_id)
    .eq("trabajador_id", trabajador_id);

  if (error) {
    throw new Error(`Error al quitar trabajador: ${error.message}`);
  }

  revalidatePath(`/semana/${semana_id}`, "page");
}

export async function guardarPropinaDiaria(formData: FormData) {
  const supabase = await createClient();

  const fecha = String(formData.get("fecha") ?? "");
  const sucursal_id = String(formData.get("sucursal_id") ?? "");
  const monto_total = Number(formData.get("monto_total") ?? 0);
  const semana_id = String(formData.get("semana_id") ?? "");

  if (!fecha || !sucursal_id || !semana_id) {
    throw new Error("Faltan datos");
  }

  if (!Number.isFinite(monto_total) || monto_total < 0) {
    throw new Error("Monto invalido");
  }

  const { data: existente, error: errorBusqueda } = await supabase
    .from("propinas_diarias")
    .select("id")
    .eq("fecha", fecha)
    .eq("sucursal_id", sucursal_id)
    .maybeSingle();

  if (errorBusqueda) {
    throw new Error(`Error validando propina diaria: ${errorBusqueda.message}`);
  }

  if (existente) {
    const { error } = await supabase
      .from("propinas_diarias")
      .update({ monto_total })
      .eq("id", existente.id);

    if (error) {
      throw new Error(`Error actualizando propina diaria: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from("propinas_diarias").insert({
      fecha,
      sucursal_id,
      monto_total,
    });

    if (error) {
      throw new Error(`Error creando propina diaria: ${error.message}`);
    }
  }

  revalidatePath(`/semana/${semana_id}`, "page");
}
