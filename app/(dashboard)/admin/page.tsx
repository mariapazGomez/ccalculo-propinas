import Link from "next/link";
import { getAdminContext, getUsuariosAdmin, getTrabajadoresAdmin, getSucursalesAdmin } from "@/modules/admin/queries";

export default async function AdminPage() {
  const { organizacion_id } = await getAdminContext();

  if (!organizacion_id) {
    return (
      <p className="text-sm text-gray-500">
        Este usuario no está asociado a ninguna organización.
      </p>
    );
  }

  const [usuarios, trabajadores, sucursales] = await Promise.all([
    getUsuariosAdmin(organizacion_id),
    getTrabajadoresAdmin(organizacion_id),
    getSucursalesAdmin(organizacion_id),
  ]);

  const stats = [
    { label: "Usuarios", count: usuarios.length, href: "/admin/usuarios" },
    { label: "Trabajadores activos", count: trabajadores.filter((t) => t.activo).length, href: "/admin/trabajadores" },
    { label: "Sucursales", count: sucursales.length, href: "/admin/usuarios" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border bg-white p-6 hover:border-black transition-colors"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold">{s.count}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/usuarios"
          className="flex items-center justify-between rounded-xl border bg-white px-6 py-4 hover:border-black transition-colors"
        >
          <div>
            <p className="font-medium">Gestionar usuarios</p>
            <p className="text-xs text-gray-500 mt-0.5">Agregar usuarios y asignar sucursales</p>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
        <Link
          href="/admin/trabajadores"
          className="flex items-center justify-between rounded-xl border bg-white px-6 py-4 hover:border-black transition-colors"
        >
          <div>
            <p className="font-medium">Gestionar trabajadores</p>
            <p className="text-xs text-gray-500 mt-0.5">Inscribir trabajadores del equipo</p>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>
    </div>
  );
}
