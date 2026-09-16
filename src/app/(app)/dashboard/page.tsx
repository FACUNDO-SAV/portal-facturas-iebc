import { getKpis, listFacturas, fmtMoney } from "@/lib/facturas";
import { FilterBar } from "../_components/FilterBar";
import { FacturasTable } from "../_components/FacturasTable";

const ESTADO_OPTIONS = [
  "Pendiente de UOP",
  "Pendiente de ingreso",
  "Pendiente de cargar",
  "Cargada ✓",
  "Pendiente de anotar",
  "Anotada ✓",
  "En duda",
  "Derivar",
];

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "red" | "amber" | "default";
}) {
  const color =
    accent === "red" ? "var(--danger)" : accent === "amber" ? "var(--warning)" : "var(--text)";
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px 18px",
        flex: 1,
        minWidth: "160px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>{label}</span>
      <span className="num" style={{ fontSize: "24px", fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; destino?: string }>;
}) {
  const { q, estado, destino } = await searchParams;
  const parsedDestino =
    destino === "intranet" || destino === "softland" || destino === "para_revisar" || destino === "no_factura"
      ? destino
      : undefined;

  const [kpis, facturas] = await Promise.all([
    getKpis(),
    listFacturas({ search: q, estado, destino: parsedDestino }),
  ]);

  return (
    <>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: "13.5px", color: "var(--text-tertiary)", margin: "4px 0 0" }}>
          Panorama general de las facturas recibidas.
        </p>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <KpiCard label="Facturas del mes" value={String(kpis.totalMes)} />
        <KpiCard label="Pendientes de UOP" value={String(kpis.pendUop)} accent={kpis.pendUop > 0 ? "red" : "default"} />
        <KpiCard
          label="Pend. cargar Intranet"
          value={String(kpis.pendIntranet)}
          accent={kpis.pendIntranet > 0 ? "amber" : "default"}
        />
        <KpiCard
          label="Pendientes Softland"
          value={String(kpis.pendSoftland)}
          accent={kpis.pendSoftland > 0 ? "amber" : "default"}
        />
        <KpiCard label="Monto total ARS (mes)" value={`$${fmtMoney(kpis.montoTotalArs)}`} />
      </div>

      <FilterBar
        action="/dashboard"
        search={q}
        estado={estado}
        estadoOptions={ESTADO_OPTIONS}
        destino={destino}
        showDestinoFilter
      />

      <FacturasTable facturas={facturas} showDestino />
    </>
  );
}
