import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGrillaSemana } from "@/modules/turnos/queries";
import TurnosSemanaBoard from "@/components/turnos/turnos-semana-board";

function getNombreDia(fecha: string): string {
  const date = new Date(`${fecha}T12:00:00`);
  return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

export default async function SemanaPage({
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

  const [grilla, { data: trabajadores }] = await Promise.all([
    getGrillaSemana(semanaId),
    supabase
      .from("trabajadores")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
  ]);

  const fechas = [...new Set(grilla.map((item) => item.fecha))];

  const filas = fechas.map((fecha) => {
    const am = grilla.find(
      (item) => item.fecha === fecha && item.turno_codigo === "AM"
    );
    const pm = grilla.find(
      (item) => item.fecha === fecha && item.turno_codigo === "PM"
    );

    return {
      fecha,
      nombreDia: getNombreDia(fecha),
      am,
      pm,
      propina: am?.propina_dia ?? pm?.propina_dia ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Grilla semanal</h1>
          <p className="text-sm text-gray-500">
            Estado:{" "}
            <span
              className={
                semana.estado === "abierta" ? "text-green-600 font-medium" : "text-gray-500"
              }
            >
              {semana.estado}
            </span>
          </p>
        </div>
        <Link
          href={`/semana/${semanaId}/resumen`}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Ver resumen
        </Link>
      </div>

      <TurnosSemanaBoard
        semanaId={semanaId}
        filas={filas}
        trabajadores={trabajadores ?? []}
      />
    </div>
  );
}
