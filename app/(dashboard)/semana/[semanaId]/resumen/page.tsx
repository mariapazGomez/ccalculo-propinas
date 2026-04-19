import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularPropinasSemana } from "@/modules/propinas/service";
import { guardarPropinasSemana, cerrarSemana } from "@/modules/propinas/actions";

export default async function ResumenPage({
  params,
}: {
  params: Promise<{ semanaId: string }>;
}) {
  const { semanaId } = await params;
  const supabase = await createClient();

  const { data: semana } = await supabase
    .from("semanas")
    .select("id, estado")
    .eq("id", semanaId)
    .maybeSingle();

  if (!semana) notFound();

  const resultados = await calcularPropinasSemana(semanaId);

  const totalPropinas = resultados.reduce((sum, r) => sum + r.monto_total, 0);
  const totalParticipaciones = resultados.reduce((sum, r) => sum + r.total_participaciones, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Resumen de propinas</h1>
          <p className="text-sm text-gray-500">
            Estado:{" "}
            <span className={semana.estado === "abierta" ? "text-green-600 font-medium" : "text-gray-500"}>
              {semana.estado}
            </span>
          </p>
        </div>
        <Link
          href={`/semana/${semanaId}`}
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Volver a la grilla
        </Link>
      </div>

      {resultados.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No hay datos para calcular. Asigna trabajadores a los turnos y registra las propinas diarias.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-xs text-gray-500">Total propinas</p>
              <p className="mt-1 text-2xl font-semibold">
                ${totalPropinas.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-xs text-gray-500">Total participaciones</p>
              <p className="mt-1 text-2xl font-semibold">{totalParticipaciones}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-xs text-gray-500">Trabajadores</p>
              <p className="mt-1 text-2xl font-semibold">{resultados.length}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-sm">
                  <th className="px-6 py-3 font-medium">Trabajador</th>
                  <th className="px-6 py-3 font-medium text-center">Participaciones</th>
                  <th className="px-6 py-3 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.trabajador_id} className="border-b last:border-0">
                    <td className="px-6 py-4 text-sm font-medium">{r.nombre}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {r.total_participaciones}
                      {r.total_participaciones > 1 && (
                        <span className="ml-1 text-xs text-blue-500">(doble en algun dia)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      ${r.monto_total.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {semana.estado === "abierta" && (
        <div className="flex gap-3">
          <form action={guardarPropinasSemana}>
            <input type="hidden" name="semana_id" value={semanaId} />
            <button
              type="submit"
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Guardar calculo
            </button>
          </form>

          <form action={cerrarSemana}>
            <input type="hidden" name="semana_id" value={semanaId} />
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
            >
              Cerrar semana
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
