import { getAdminContext, getOrganizacion } from "@/modules/admin/queries";
import { actualizarLimiteHoras } from "@/modules/admin/actions";

export default async function ConfiguracionPage() {
  const { organizacion_id } = await getAdminContext();
  const org = organizacion_id ? await getOrganizacion(organizacion_id) : null;
  const limiteActual = org?.limite_horas_semana ?? 40;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Configuración
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Parámetros de la organización
        </p>
      </div>

      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#eef2ff" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Límite de horas semanales por trabajador
          </h2>
        </div>

        <form action={actualizarLimiteHoras} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Horas máximas por semana
            </label>
            <input
              type="number"
              name="limite_horas_semana"
              required
              min="8"
              max="168"
              step="1"
              defaultValue={limiteActual}
              className="block w-28 rounded-xl border px-3.5 py-2 text-sm outline-none transition-colors focus:border-indigo-400"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Equivale a
            </label>
            <p className="py-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {Math.floor(limiteActual / 8)} turno{Math.floor(limiteActual / 8) !== 1 ? "s" : ""} máx. por semana
            </p>
          </div>
          <button
            type="submit"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
