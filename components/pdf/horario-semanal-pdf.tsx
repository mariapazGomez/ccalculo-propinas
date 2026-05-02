import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1e293b",
  },
  header: {
    marginBottom: 24,
    borderBottom: "1.5pt solid #6366f1",
    paddingBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#6366f1",
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 2,
  },
  periodo: {
    fontSize: 10,
    color: "#94a3b8",
  },
  tabla: {
    marginTop: 8,
  },
  fila: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e2e8f0",
    minHeight: 36,
  },
  filaHeader: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    borderBottom: "1pt solid #c7d2fe",
    minHeight: 28,
  },
  celdaDia: {
    width: "22%",
    padding: "6pt 8pt",
    borderRight: "0.5pt solid #e2e8f0",
    justifyContent: "center",
  },
  celdaTurno: {
    width: "39%",
    padding: "6pt 8pt",
    borderRight: "0.5pt solid #e2e8f0",
    justifyContent: "center",
  },
  celdaUltima: {
    width: "39%",
    padding: "6pt 8pt",
    justifyContent: "center",
  },
  headerText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#6366f1",
    textTransform: "uppercase",
  },
  diaNombre: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#1e293b",
    textTransform: "capitalize",
  },
  diaFecha: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 2,
  },
  trabajador: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 2,
  },
  vacio: {
    fontSize: 9,
    color: "#cbd5e1",
    fontStyle: "italic",
  },
  footer: {
    marginTop: 24,
    borderTop: "0.5pt solid #e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

type Trabajador = { id: string; nombre: string };

type FilaPDF = {
  fecha: string;
  nombreDia: string;
  am: Trabajador[];
  pm: Trabajador[];
};

type Props = {
  orgNombre: string;
  fechaInicio: string;
  fechaFin: string;
  filas: FilaPDF[];
};

function formatFecha(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HorarioSemanalPDF({ orgNombre, fechaInicio, fechaFin, filas }: Props) {
  const periodo = `${formatFecha(fechaInicio)} — ${formatFecha(fechaFin)}`;
  const generado = new Date().toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title={`Horario Semanal - ${periodo}`}>
      <Page size="A4" style={s.page}>
        {/* Encabezado */}
        <View style={s.header}>
          <Text style={s.titulo}>Horario Semanal</Text>
          <Text style={s.subtitulo}>{orgNombre}</Text>
          <Text style={s.periodo}>{periodo}</Text>
        </View>

        {/* Tabla */}
        <View style={s.tabla}>
          {/* Fila header */}
          <View style={s.filaHeader}>
            <View style={s.celdaDia}>
              <Text style={s.headerText}>Día</Text>
            </View>
            <View style={s.celdaTurno}>
              <Text style={s.headerText}>Turno AM</Text>
            </View>
            <View style={s.celdaUltima}>
              <Text style={s.headerText}>Turno PM</Text>
            </View>
          </View>

          {/* Filas de datos */}
          {filas.map((fila) => {
            const partesDia = fila.nombreDia.split(" ");
            const diaNombre = partesDia[0];
            const diaFecha = partesDia.slice(1).join(" ");

            return (
              <View key={fila.fecha} style={s.fila}>
                <View style={s.celdaDia}>
                  <Text style={s.diaNombre}>{diaNombre}</Text>
                  <Text style={s.diaFecha}>{diaFecha}</Text>
                </View>
                <View style={s.celdaTurno}>
                  {fila.am.length > 0
                    ? fila.am.map((t) => (
                        <Text key={t.id} style={s.trabajador}>• {t.nombre}</Text>
                      ))
                    : <Text style={s.vacio}>Sin asignar</Text>}
                </View>
                <View style={s.celdaUltima}>
                  {fila.pm.length > 0
                    ? fila.pm.map((t) => (
                        <Text key={t.id} style={s.trabajador}>• {t.nombre}</Text>
                      ))
                    : <Text style={s.vacio}>Sin asignar</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Pie de página */}
        <View style={s.footer}>
          <Text style={s.footerText}>Generado el {generado}</Text>
          <Text style={s.footerText}>Estado: Programada</Text>
        </View>
      </Page>
    </Document>
  );
}
