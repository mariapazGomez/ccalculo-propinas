type Props = {
  titulo: string;
  periodo: string;
  total: number;
  puntos: number[];
  gradId: string;
  color?: string;
};

export function GraficoLinea({
  titulo,
  periodo,
  total,
  puntos,
  gradId,
  color = "#6366f1",
}: Props) {
  const W = 300;
  const H = 72;
  const PT = 4; // padding top so the peak has breathing room

  const n = puntos.length;
  const maxVal = Math.max(...puntos, 1);
  const allZero = puntos.every((v) => v === 0);

  const toX = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const toY = (v: number) => PT + (H - PT) * (1 - v / maxVal);

  const coords = puntos.map((v, i): [number, number] => [toX(i), toY(v)]);
  const pointsStr = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  const fillD =
    n === 0
      ? ""
      : [
          `M${coords[0][0].toFixed(2)},${coords[0][1].toFixed(2)}`,
          ...coords.slice(1).map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`),
          `L${coords[n - 1][0].toFixed(2)},${H}`,
          `L${coords[0][0].toFixed(2)},${H}`,
          "Z",
        ].join(" ");

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div>
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {titulo}
        </p>
        <p
          className="mt-1 text-xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          ${total.toLocaleString("es-CL")}
        </p>
      </div>

      {allZero ? (
        <div
          className="flex h-[72px] items-center justify-center rounded-xl"
          style={{ background: "#f8fafc" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sin datos registrados
          </p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "72px" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={fillD} fill={`url(#${gradId})`} />
          <polyline
            points={pointsStr}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}

      <p className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
        {periodo}
      </p>
    </div>
  );
}
