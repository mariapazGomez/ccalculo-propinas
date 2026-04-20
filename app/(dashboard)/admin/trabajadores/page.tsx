import { getAdminContext, getTrabajadoresAdmin } from "@/modules/admin/queries";
import { crearTrabajador, toggleTrabajadorActivo, eliminarTrabajador } from "@/modules/admin/actions";

export default async function TrabajadoresAdminPage() {
  const { organizacion_id } = await getAdminContext();
  if (!organizacion_id) return <p className="text-sm text-gray-500">Sin organización.</p>;

  const trabajadores = await getTrabajadoresAdmin(organizacion_id);
  const activos = trabajadores.filter((t) => t.activo);
  const inactivos = trabajadores.filter((t) => !t.activo);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Trabajadores</h1>

      {/* Lista activos */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-3 flex items-center justify-between">
          <p className="text-sm font-medium">Activos ({activos.length})</p>
        </div>
        {activos.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">No hay trabajadores activos.</p>
        ) : (
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">RUT</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Teléfono</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {activos.map((t) => (
                <tr key={t.id} className="border-b last:border-0 text-sm">
                  <td className="px-6 py-3 font-medium">{t.nombre}</td>
                  <td className="px-6 py-3 text-gray-600">{t.rut ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-600">{t.email ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-600">{t.telefono ?? "—"}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <form action={toggleTrabajadorActivo}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="activo" value="true" />
                        <button type="submit" className="text-xs text-gray-500 hover:text-gray-700">
                          Desactivar
                        </button>
                      </form>
                      <form action={eliminarTrabajador}>
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Lista inactivos */}
      {inactivos.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-3">
            <p className="text-sm font-medium text-gray-400">Inactivos ({inactivos.length})</p>
          </div>
          <ul className="divide-y">
            {inactivos.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-gray-400">{t.nombre}</span>
                <div className="flex items-center gap-3">
                  <form action={toggleTrabajadorActivo}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="activo" value="false" />
                    <button type="submit" className="text-xs text-green-600 hover:text-green-800">
                      Reactivar
                    </button>
                  </form>
                  <form action={eliminarTrabajador}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulario nuevo trabajador */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-3">
          <p className="text-sm font-medium">Inscribir trabajador</p>
        </div>
        <form action={crearTrabajador} className="px-6 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="Nombre Apellido"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">RUT</label>
              <input
                name="rut"
                type="text"
                placeholder="12.345.678-9"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input
                name="email"
                type="email"
                placeholder="trabajador@ejemplo.com"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Teléfono</label>
              <input
                name="telefono"
                type="text"
                placeholder="+56 9 1234 5678"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2 text-sm text-white hover:bg-gray-800"
          >
            Inscribir trabajador
          </button>
        </form>
      </div>
    </div>
  );
}
