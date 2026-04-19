"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularPropinasSemana } from "./service";

export async function guardarPropinasSemana(formData: FormData) {
  const supabase = await createClient();
  const semana_id = String(formData.get("semana_id") ?? "");

  if (!semana_id) throw new Error("Semana no valida");

  const resultados = await calcularPropinasSemana(semana_id);

  await supabase.from("propinas_calculadas").delete().eq("semana_id", semana_id);

  if (resultados.length > 0) {
    const { error } = await supabase.from("propinas_calculadas").insert(
      resultados.map((item) => ({
        semana_id,
        trabajador_id: item.trabajador_id,
        total_participaciones: item.total_participaciones,
        monto_total: Number(item.monto_total.toFixed(2)),
      }))
    );

    if (error) {
      throw new Error(`No se pudieron guardar las propinas: ${error.message}`);
    }
  }

  revalidatePath(`/semana/${semana_id}/resumen`, "page");
}

export async function cerrarSemana(formData: FormData) {
  const supabase = await createClient();
  const semana_id = String(formData.get("semana_id") ?? "");

  if (!semana_id) throw new Error("Semana no valida");

  const resultados = await calcularPropinasSemana(semana_id);

  await supabase.from("propinas_calculadas").delete().eq("semana_id", semana_id);

  if (resultados.length > 0) {
    const { error: errorInsert } = await supabase.from("propinas_calculadas").insert(
      resultados.map((item) => ({
        semana_id,
        trabajador_id: item.trabajador_id,
        total_participaciones: item.total_participaciones,
        monto_total: Number(item.monto_total.toFixed(2)),
      }))
    );

    if (errorInsert) {
      throw new Error(`No se pudieron guardar las propinas: ${errorInsert.message}`);
    }
  }

  const { error: errorSemana } = await supabase
    .from("semanas")
    .update({ estado: "cerrada" })
    .eq("id", semana_id);

  if (errorSemana) {
    throw new Error(`No se pudo cerrar la semana: ${errorSemana.message}`);
  }

  revalidatePath("/semana", "page");
  revalidatePath(`/semana/${semana_id}/resumen`, "page");
}
