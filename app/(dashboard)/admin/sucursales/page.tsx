import { getAdminContext, getSucursalesAdmin } from "@/modules/admin/queries";
import { crearSucursal, eliminarSucursal } from "@/modules/admin/actions";

export default async function SucursalesAdminPage() {
  const { organizacion_id } = await getAdminContext();
  if (!organizacion_id) return <p className="text-sm text-gray-500">Sin organización.</p>;

  const sucursales = await getSucursalesAdmin(organizacion_id);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Sucursales</h1>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-3">
          <p className="text-sm font-medium">Sucursales registradas ({sucursales.length})</p>
        </div>
        {sucursales.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">
            No hay sucursales. Crea una para poder generar semanas con turnos.
          </p>
        ) : (
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Código</th>
                <th className="px-6 py-3 font-medium">Dirección</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sucursales.map((s) => (
                <tr key={s.id} className="border-b last:border-0 text-sm">
                  <td className="px-6 py-3 font-medium">{s.nombre}</td>
                  <td className="px-6 py-3 text-gray-600">{s.codigo ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-600">{(s as { direccion?: string | null }).direccion ?? "—"}</td>
                  <td className="px-6 py-3">
                    <form action={eliminarSucursal}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-3">
          <p className="text-sm font-medium">Agregar sucursal</p>
        </div>
        <form action={crearSucursal} className="px-6 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="Ej: Quilpué Centro"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Código</label>
              <input
                name="codigo"
                type="text"
                placeholder="Ej: QUI"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Dirección</label>
              <input
                name="direccion"
                type="text"
                placeholder="Ej: Av. Principal 123"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2 text-sm text-white hover:bg-gray-800"
          >
            Agregar sucursal
          </button>
        </form>
      </div>
    </div>
  );
}
