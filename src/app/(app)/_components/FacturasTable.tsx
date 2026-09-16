import Link from "next/link";
import {
  Factura,
  destinoBadge,
  estadoBadgeClass,
  fmtDate,
  fmtMoney,
} from "@/lib/facturas";

export function FacturasTable({
  facturas,
  showDestino = true,
}: {
  facturas: Factura[];
  showDestino?: boolean;
}) {
  if (facturas.length === 0) {
    return (
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
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>CUIT</th>
            <th>Comprobante</th>
            <th>Fecha emisión</th>
            <th style={{ textAlign: "right" }}>Monto</th>
            {showDestino && <th>Destino</th>}
            <th>Estado</th>
            <th>UOP</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((f) => {
            const d = destinoBadge(f.destino);
            return (
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
                {showDestino && (
                  <td>
                    <span className={`badge ${d.cls}`}>
                      <span className="dot" />
                      {d.label}
                    </span>
                  </td>
                )}
                <td>
                  <span className={`badge ${estadoBadgeClass(f.estado)}`}>
                    <span className="dot" />
                    {f.estado}
                  </span>
                </td>
                <td className="num" style={{ color: f.uop ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                  {f.uop ?? "—"}
                </td>
                <td>
                  <Link href={`/facturas/${f.id}`} style={{ color: "var(--text-tertiary)", display: "flex" }}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="7,4 13,10 7,16" />
                    </svg>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
