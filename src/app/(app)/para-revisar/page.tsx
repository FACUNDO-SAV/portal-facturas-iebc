import Link from "next/link";
import { listFacturas, estadoBadgeClass, fmtDate, fmtMoney, getProveedorResumen } from "@/lib/facturas";
import { FilterBar } from "../_components/FilterBar";
import { routeParaRevisar } from "../actions";

const ESTADO_OPTIONS = ["Pendiente de UOP", "Resuelta ✓", "Derivar"];

export default async function ParaRevisarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const facturas = await listFacturas({ search: q, estado, destino: "para_revisar" });

  const sugerencias = await Promise.all(
    facturas.map(async (f) => {
      if (f.uop_sugerida) return f.uop_sugerida;
      const resumen = await getProveedorResumen(f.cuit);
      return resumen?.uop_habitual ?? null;
    })
  );

  return (
    <>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Para revisar</h1>
        <p style={{ fontSize: "13.5px", color: "var(--text-tertiary)", margin: "4px 0 0" }}>
          Facturas sin UOP reconocida. Asigná la UOP correcta — el Portal recuerda tu corrección como la
          habitual de ese proveedor para la próxima vez que falte la referencia.
        </p>
      </div>

      <FilterBar action="/para-revisar" search={q} estado={estado} estadoOptions={ESTADO_OPTIONS} />

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
          No hay facturas pendientes de revisión.
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
                <th>Asignar UOP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f, i) => {
                const sugerida = sugerencias[i];
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
                    <td>
                      <span className={`badge ${estadoBadgeClass(f.estado)}`}>
                        <span className="dot" />
                        {f.estado}
                      </span>
                    </td>
                    <td>
                      <form
                        action={routeParaRevisar.bind(null, f.id)}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <input
                          type="number"
                          name="uop"
                          placeholder={sugerida ? String(sugerida) : "UOP"}
                          defaultValue={sugerida ?? undefined}
                          style={{
                            width: "72px",
                            padding: "5px 8px",
                            fontSize: "12.5px",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            background: "var(--bg)",
                            color: "var(--text)",
                          }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ fontSize: "12.5px", padding: "6px 12px" }}>
                          Asignar
                        </button>
                      </form>
                      {sugerida ? (
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          Sugerida por antecedente: UOP {sugerida}
                        </span>
                      ) : null}
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
      )}
    </>
  );
}
