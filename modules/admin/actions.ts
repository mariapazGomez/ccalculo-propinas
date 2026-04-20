"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "./queries";

export async function crearUsuario(formData: FormData) {
  const { organizacion_id } = await getAdminContext();
  if (!organizacion_id) throw new Error("Sin organizacion");

  const nombre_completo = String(formData.get("nombre_completo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const sucursalIds = formData.getAll("sucursal_ids").map(String);

  if (!nombre_completo || !email || !password) throw new Error("Faltan campos obligatorios");

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre_completo },
  });

  if (error) throw new Error(`Error creando usuario: ${error.message}`);
  const userId = data.user.id;

  await admin.from("perfiles").upsert({ id: userId, email, nombre_completo });

  await admin.from("miembros_organizacion").insert({
    usuario_id: userId,
    organizacion_id,
    rol: "lector",
  });

  if (sucursalIds.length > 0) {
    await admin.from("miembros_sucursal").insert(
      sucursalIds.map((sucursal_id) => ({ usuario_id: userId, sucursal_id }))
    );
  }

  revalidatePath("/admin/usuarios");
}

export async function actualizarSucursalesUsuario(formData: FormData) {
  const admin = createAdminClient();

  const usuario_id = String(formData.get("usuario_id") ?? "");
  const sucursalIds = formData.getAll("sucursal_ids").map(String);

  if (!usuario_id) throw new Error("Faltan datos");

  await admin.from("miembros_sucursal").delete().eq("usuario_id", usuario_id);

  if (sucursalIds.length > 0) {
    await admin.from("miembros_sucursal").insert(
      sucursalIds.map((sucursal_id) => ({ usuario_id, sucursal_id }))
    );
  }

  revalidatePath("/admin/usuarios");
}

export async function crearTrabajador(formData: FormData) {
  const { organizacion_id } = await getAdminContext();
  if (!organizacion_id) throw new Error("Sin organizacion");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const rut = String(formData.get("rut") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;

  if (!nombre) throw new Error("El nombre es obligatorio");

  const admin = createAdminClient();
  const { error } = await admin.from("trabajadores").insert({
    nombre,
    rut,
    email,
    telefono,
    organizacion_id,
    activo: true,
  });

  if (error) throw new Error(`Error creando trabajador: ${error.message}`);
  revalidatePath("/admin/trabajadores");
}

export async function toggleTrabajadorActivo(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "");
  const activo = formData.get("activo") === "true";

  await admin.from("trabajadores").update({ activo: !activo }).eq("id", id);
  revalidatePath("/admin/trabajadores");
}

export async function eliminarTrabajador(formData: FormData) {
  await getAdminContext();
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID requerido");

  const { error } = await admin.from("trabajadores").delete().eq("id", id);
  if (error) throw new Error(`Error eliminando trabajador: ${error.message}`);
  revalidatePath("/admin/trabajadores");
}

export async function crearSucursal(formData: FormData) {
  const { organizacion_id } = await getAdminContext();
  if (!organizacion_id) throw new Error("Sin organizacion");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const codigo = String(formData.get("codigo") ?? "").trim() || null;
  const direccion = String(formData.get("direccion") ?? "").trim() || null;

  if (!nombre) throw new Error("El nombre es obligatorio");

  const admin = createAdminClient();
  const { error } = await admin.from("sucursales").insert({
    nombre,
    codigo,
    direccion,
    organizacion_id,
  });

  if (error) throw new Error(`Error creando sucursal: ${error.message}`);
  revalidatePath("/admin/sucursales");
}

export async function eliminarSucursal(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID requerido");

  const { error } = await admin.from("sucursales").delete().eq("id", id);
  if (error) throw new Error(`Error eliminando sucursal: ${error.message}`);
  revalidatePath("/admin/sucursales");
}
