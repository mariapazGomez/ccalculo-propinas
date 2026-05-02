import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCalendarioContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: membresia } = await admin
    .from("miembros_organizacion")
    .select("organizacion_id, rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const rol = membresia?.rol ?? null;
  if (rol !== "admin" && rol !== "calendario") redirect("/semana");

  return {
    user,
    organizacion_id: membresia!.organizacion_id,
    rol: rol as "admin" | "calendario",
    isAdmin: rol === "admin",
  };
}
