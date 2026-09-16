import Link from "next/link";
import { listFacturas, estadoBadgeClass, fmtDate, fmtMoney } from "@/lib/facturas";
import { FilterBar } from "../_components/FilterBar";
import { confirmSoftland } from "../actions";

const ESTADO_OPTIONS = ["Pendiente de anotar", "Anotada ✓", "En duda"];

export default async function SoftlandPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const facturas = await listFacturas({ search: q, estado, destino: "softland" });

  return (
    <>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Softland</h1>
        <p style={{ fontSize: "13.5px", color: "var(--text-tertiary)", margin: "4px 0 0" }}>
          Facturas de UOP 184, 413 o ≥1000. Se anotan a mano en Softland — confirmá acá una vez que las
          registraste, para llevar el control.
        </p>
      </div>

      <FilterBar action="/softland" search={q} estado={estado} estadoOptions={ESTADO_OPTIONS} />

      {facturas.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--text-tertiary)",
            fontSize: "13.5px",
          }}
        >
          No hay facturas que coincidan con estos filtros.
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>CUIT</th>
                <th>Comprobante</th>
                <th>Fecha emisión</th>
                <th style={{ textAlign: "right" }}>Monto</th>
                <th>Estado</th>
                <th>UOP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link href={`/facturas/${f.id}`} className="prov-name" style={{ color: "var(--text)" }}>
                      {f.proveedor_nombre}
                    </Link>
                  </td>
                  <td className="num" style={{ color: "var(--text-secondary)" }}>
                    {f.cuit}
                  </td>
                  <td className="num" style={{ color: "var(--text-secondary)" }}>
                    {f.tipo_comprobante ? `${f.tipo_comprobante} ` : ""}
                    {f.numero_comprobante}
                  </td>
                  <td className="num" style={{ color: "var(--text-secondary)" }}>
                    {fmtDate(f.fecha_emision)}
                  </td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>
                    {f.moneda !== "ARS" ? `${f.moneda} ` : "$"}
                    {fmtMoney(f.monto)}
                  </td>
                  <td>
                    <span className={`badge ${estadoBadgeClass(f.estado)}`}>
                      <span className="dot" />
                      {f.estado}
                    </span>
                  </td>
                  <td className="num" style={{ color: f.uop ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                    {f.uop ?? "—"}
                  </td>
                  <td style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                    {f.estado === "Pendiente de anotar" ? (
                      <form action={confirmSoftland.bind(null, f.id)}>
                        <button type="submit" className="btn btn-primary" style={{ fontSize: "12.5px", padding: "6px 12px" }}>
                          Confirmar registración
                        </button>
                      </form>
                    ) : null}
                    <Link href={`/facturas/${f.id}`} style={{ color: "var(--text-tertiary)", display: "flex" }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="7,4 13,10 7,16" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
