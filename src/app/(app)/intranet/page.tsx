import { listFacturas } from "@/lib/facturas";
import { FilterBar } from "../_components/FilterBar";
import { FacturasTable } from "../_components/FacturasTable";

const ESTADO_OPTIONS = ["Pendiente de ingreso", "Pendiente de cargar", "Cargada ✓", "En duda"];

export default async function IntranetPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const facturas = await listFacturas({ search: q, estado, destino: "intranet" });

  return (
    <>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Intranet</h1>
        <p style={{ fontSize: "13.5px", color: "var(--text-tertiary)", margin: "4px 0 0" }}>
          Facturas que se cargan automáticamente en el Intranet real. No requieren confirmación manual: el
          Portal las carga solo y marca &quot;Cargada ✓&quot; cuando lo verifica.
        </p>
      </div>

      <FilterBar action="/intranet" search={q} estado={estado} estadoOptions={ESTADO_OPTIONS} />

      <FacturasTable facturas={facturas} showDestino={false} />
    </>
  );
}
