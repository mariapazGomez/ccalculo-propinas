import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGrillaSemana, getTrabajadoresConDomingoRestringido } from "@/modules/turnos/queries";
import { getAdminContext } from "@/modules/admin/queries";
import TurnosSemanaBoard from "@/components/turnos/turnos-semana-board";
import GuardarHorarioButton from "@/components/semana/guardar-horario-button";

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
  const { rol } = await getAdminContext();
  const mostrarPropinas = rol !== "calendario";

  const { data: semana } = await supabase
    .from("semanas")
    .select("id, estado, fecha_inicio, fecha_fin, organizacion_id")
    .eq("id", semanaId)
    .maybeSingle();

  if (!semana) notFound();

  const admin = createAdminClient();
  const [grilla, { data: trabajadores }, domingoRestringidoIds, orgData] = await Promise.all([
    getGrillaSemana(semanaId),
    supabase
      .from("trabajadores")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    getTrabajadoresConDomingoRestringido(semana.fecha_inicio),
    admin.from("organizaciones").select("limite_horas_semana").eq("id", semana.organizacion_id).single(),
  ]);

  const limiteHoras = orgData.data?.limite_horas_semana ?? 40;

  const horasPorTrabajador: Record<string, number> = {};
  for (const item of grilla) {
    for (const t of item.trabajadores) {
      horasPorTrabajador[t.id] = (horasPorTrabajador[t.id] ?? 0) + 8;
    }
  }

  const fechas = [...new Set(grilla.map((item) => item.fecha))];

  const filas = fechas.map((fecha) => {
    const am = grilla.find((item) => item.fecha === fecha && item.turno_codigo === "AM");
    const pm = grilla.find((item) => item.fecha === fecha && item.turno_codigo === "PM");
    return {
      fecha,
      nombreDia: getNombreDia(fecha),
      am,
      pm,
      propina: am?.propina_dia ?? pm?.propina_dia ?? null,
    };
  });

  const periodoLabel = semana.fecha_inicio && semana.fecha_fin
    ? `${new Date(semana.fecha_inicio + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" })} — ${new Date(semana.fecha_fin + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`
    : "";

  const abierta = semana.estado === "abierta";
  const programada = semana.estado === "programada";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/semana"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-slate-50"
            style={{ borderColor: "var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Grilla semanal
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                abierta ? "bg-emerald-50 text-emerald-700" :
                programada ? "bg-indigo-50 text-indigo-700" :
                "bg-slate-100 text-slate-500"
              }`}>
                {abierta ? "Abierta" : programada ? "Programada" : "Cerrada"}
              </span>
            </div>
            {periodoLabel && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>{periodoLabel}</p>
            )}
          </div>
        </div>

        {mostrarPropinas ? (
          <Link
            href={`/semana/${semanaId}/resumen`}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Ver resumen
          </Link>
        ) : abierta ? (
          <GuardarHorarioButton semanaId={semanaId} />
        ) : programada ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium"
              style={{ borderColor: "#c7d2fe", color: "#6366f1", background: "#eef2ff" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Guardado
            </div>
            <a
              href={`/api/semana/${semanaId}/pdf`}
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </a>
          </div>
        ) : null}
      </div>

      <TurnosSemanaBoard
        semanaId={semanaId}
        filas={filas}
        trabajadores={trabajadores ?? []}
        mostrarPropinas={mostrarPropinas}
        horasPorTrabajador={horasPorTrabajador}
        limiteHoras={limiteHoras}
        domingoRestringidoIds={domingoRestringidoIds}
      />
    </div>
  );
}
