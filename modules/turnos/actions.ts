"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return user;
}

export async function asignarTrabajadorATurno(formData: FormData) {
  await requireAuth();
  const admin = createAdminClient();

  const turno_dia_id = String(formData.get("turno_dia_id") ?? "");
  const trabajador_id = String(formData.get("trabajador_id") ?? "");
  const semana_id = String(formData.get("semana_id") ?? "");

  if (!turno_dia_id || !trabajador_id || !semana_id) {
    throw new Error("Faltan datos");
  }

  // Obtener fecha del turno desde la BD (fuente de verdad, no del cliente)
  const { data: turnoDia, error: errorTurnoDia } = await admin
    .from("turnos_dia")
    .select("fecha, semana_id")
    .eq("id", turno_dia_id)
    .single();

  if (errorTurnoDia || !turnoDia) throw new Error("Turno no encontrado");

  // Obtener todos los turnos_dia de la semana para ambas validaciones
  const { data: turnosSemana } = await admin
    .from("turnos_dia")
    .select("id, fecha")
    .eq("semana_id", turnoDia.semana_id);

  const idsSemana = (turnosSemana ?? []).map((t) => t.id);
  const idsMismaFecha = (turnosSemana ?? [])
    .filter((t) => t.fecha === turnoDia.fecha && t.id !== turno_dia_id)
    .map((t) => t.id);

  // Obtener límite de horas de la organización
  const { data: semana } = await admin
    .from("semanas")
    .select("organizacion_id")
    .eq("id", turnoDia.semana_id)
    .single();

  const { data: org } = await admin
    .from("organizaciones")
    .select("limite_horas_semana")
    .eq("id", semana?.organizacion_id ?? "")
    .single();

  const limiteHoras = org?.limite_horas_semana ?? 40;
  const maxTurnos = Math.floor(limiteHoras / 8);

  // Validación 1: sin turno doble en el mismo día
  if (idsMismaFecha.length > 0) {
    const { count: dobles } = await admin
      .from("asignaciones_turno")
      .select("id", { count: "exact", head: true })
      .eq("trabajador_id", trabajador_id)
      .in("turno_dia_id", idsMismaFecha);

    if ((dobles ?? 0) > 0) {
      throw new Error("El trabajador ya tiene un turno asignado para ese día.");
    }
  }

  // Validación 3: restricción de domingo (no puede trabajar domingo si trabajó el domingo pasado)
  const esDomingo = new Date(turnoDia.fecha + "T12:00:00").getDay() === 0;
  if (esDomingo) {
    const dPrevio = new Date(turnoDia.fecha + "T12:00:00");
    dPrevio.setDate(dPrevio.getDate() - 7);
    const domingoAnterior = dPrevio.toISOString().split("T")[0];

    const { data: turnosDomingoAnt } = await admin
      .from("turnos_dia")
      .select("id")
      .eq("fecha", domingoAnterior);

    if (turnosDomingoAnt?.length) {
      const idsDomingoAnt = turnosDomingoAnt.map((t) => t.id);
      const { count: trabajoElDomingoAnt } = await admin
        .from("asignaciones_turno")
        .select("id", { count: "exact", head: true })
        .eq("trabajador_id", trabajador_id)
        .in("turno_dia_id", idsDomingoAnt);

      if ((trabajoElDomingoAnt ?? 0) > 0) {
        throw new Error("Este trabajador no puede trabajar el domingo porque trabajó el domingo pasado.");
      }
    }
  }

  // Validación 2: límite de horas semanales
  if (idsSemana.length > 0) {
    const { count: turnosActuales } = await admin
      .from("asignaciones_turno")
      .select("id", { count: "exact", head: true })
      .eq("trabajador_id", trabajador_id)
      .in("turno_dia_id", idsSemana);

    if ((turnosActuales ?? 0) >= maxTurnos) {
      throw new Error(`El trabajador ya alcanzó el límite de ${limiteHoras} horas semanales.`);
    }
  }

  // Verificar si ya está asignado (idempotente)
  const { data: existente, error: errorBusqueda } = await admin
    .from("asignaciones_turno")
    .select("id")
    .eq("turno_dia_id", turno_dia_id)
    .eq("trabajador_id", trabajador_id)
    .maybeSingle();

  if (errorBusqueda) {
    throw new Error(`Error validando asignacion: ${errorBusqueda.message}`);
  }

  if (!existente) {
    const { error } = await admin.from("asignaciones_turno").insert({
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
  await requireAuth();
  const admin = createAdminClient();

  const turno_dia_id = String(formData.get("turno_dia_id") ?? "");
  const trabajador_id = String(formData.get("trabajador_id") ?? "");
  const semana_id = String(formData.get("semana_id") ?? "");

  if (!turno_dia_id || !trabajador_id || !semana_id) {
    throw new Error("Faltan datos");
  }

  const { error } = await admin
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
  await requireAuth();
  const admin = createAdminClient();

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

  const { data: existente, error: errorBusqueda } = await admin
    .from("propinas_diarias")
    .select("id")
    .eq("fecha", fecha)
    .eq("sucursal_id", sucursal_id)
    .maybeSingle();

  if (errorBusqueda) {
    throw new Error(`Error validando propina diaria: ${errorBusqueda.message}`);
  }

  if (existente) {
    const { error } = await admin
      .from("propinas_diarias")
      .update({ monto_total })
      .eq("id", existente.id);

    if (error) {
      throw new Error(`Error actualizando propina diaria: ${error.message}`);
    }
  } else {
    const { error } = await admin.from("propinas_diarias").insert({
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
