import Link from "next/link";
import { getSemanas } from "@/modules/turnos/queries";

export default async function SemanasPage() {
  const semanas = await getSemanas();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Semanas</h1>

      {semanas.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay semanas registradas.</p>
      ) : (
        <ul className="space-y-2">
          {semanas.map((semana) => (
            <li key={semana.id}>
              <Link
                href={`/semana/${semana.id}`}
                className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 hover:border-black transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium font-mono text-gray-700">{semana.id}</p>
                  <p className="text-xs text-gray-400">
                    Creada: {new Date(semana.creado_en).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    semana.estado === "abierta"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {semana.estado}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
