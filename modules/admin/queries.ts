import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getAdminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const admin = createAdminClient();
  const { data: membresia } = await admin
    .from("miembros_organizacion")
    .select("organizacion_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  return { user, organizacion_id: membresia?.organizacion_id ?? null };
}

export async function getSucursalesAdmin(organizacion_id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("sucursales")
    .select("id, nombre, codigo")
    .eq("organizacion_id", organizacion_id)
    .order("nombre");
  return data ?? [];
}

export async function getUsuariosAdmin(organizacion_id: string) {
  const admin = createAdminClient();
  const { data: miembros } = await admin
    .from("miembros_organizacion")
    .select("usuario_id, rol")
    .eq("organizacion_id", organizacion_id);

  if (!miembros || miembros.length === 0) return [];

  const userIds = miembros.map((m) => m.usuario_id);

  const { data: perfiles } = await admin
    .from("perfiles")
    .select("id, email, nombre_completo")
    .in("id", userIds);

  const { data: sucursalesUsuarios } = await admin
    .from("miembros_sucursal")
    .select("usuario_id, sucursal_id, sucursales(nombre)")
    .in("usuario_id", userIds);

  const rolMap = new Map(miembros.map((m) => [m.usuario_id, m.rol]));
  const sucursalesMap = new Map<string, { id: string; nombre: string }[]>();

  for (const ms of sucursalesUsuarios ?? []) {
    const lista = sucursalesMap.get(ms.usuario_id) ?? [];
    const sucursal = ms.sucursales as unknown as { nombre: string } | null;
    lista.push({ id: ms.sucursal_id, nombre: sucursal?.nombre ?? ms.sucursal_id });
    sucursalesMap.set(ms.usuario_id, lista);
  }

  return (perfiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    nombre_completo: p.nombre_completo,
    rol: rolMap.get(p.id) ?? "lector",
    sucursales: sucursalesMap.get(p.id) ?? [],
  }));
}

export async function getTrabajadoresAdmin(organizacion_id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trabajadores")
    .select("id, nombre, rut, email, telefono, activo, creado_en")
    .eq("organizacion_id", organizacion_id)
    .order("nombre");
  return data ?? [];
}
