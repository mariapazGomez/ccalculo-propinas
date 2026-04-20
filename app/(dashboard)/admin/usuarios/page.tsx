import { getAdminContext, getUsuariosAdmin, getSucursalesAdmin } from "@/modules/admin/queries";
import { crearUsuario, actualizarSucursalesUsuario } from "@/modules/admin/actions";

export default async function UsuariosAdminPage() {
  const { organizacion_id } = await getAdminContext();
  if (!organizacion_id) return <p className="text-sm text-gray-500">Sin organización.</p>;

  const [usuarios, sucursales] = await Promise.all([
    getUsuariosAdmin(organizacion_id),
    getSucursalesAdmin(organizacion_id),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Usuarios</h1>

      {/* Lista */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-3">
          <p className="text-sm font-medium">Usuarios registrados</p>
        </div>
        {usuarios.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">No hay usuarios en esta organización.</p>
        ) : (
          <ul className="divide-y">
            {usuarios.map((u) => (
              <li key={u.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-sm">{u.nombre_completo ?? u.email}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Sucursales: {u.sucursales.length === 0 ? "ninguna" : u.sucursales.map((s) => s.nombre).join(", ")}
                    </p>
                  </div>

                  <form action={actualizarSucursalesUsuario} className="space-y-2 min-w-[200px]">
                    <input type="hidden" name="usuario_id" value={u.id} />
                    <p className="text-xs font-medium text-gray-600">Sucursales asignadas</p>
                    <div className="space-y-1">
                      {sucursales.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="sucursal_ids"
                            value={s.id}
                            defaultChecked={u.sucursales.some((us) => us.id === s.id)}
                          />
                          {s.nombre}
                        </label>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="mt-2 rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800"
                    >
                      Guardar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Formulario nuevo usuario */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-3">
          <p className="text-sm font-medium">Agregar usuario</p>
        </div>
        <form action={crearUsuario} className="px-6 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nombre completo</label>
              <input
                name="nombre_completo"
                type="text"
                required
                placeholder="Nombre Apellido"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="usuario@ejemplo.com"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Contraseña temporal</label>
              <input
                name="password"
                type="text"
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {sucursales.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Asignar a sucursales</p>
              <div className="flex flex-wrap gap-4">
                {sucursales.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="sucursal_ids" value={s.id} />
                    {s.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2 text-sm text-white hover:bg-gray-800"
          >
            Crear usuario
          </button>
        </form>
      </div>
    </div>
  );
}
