import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFactura,
  getDesglose,
  getMailOrigen,
  destinoBadge,
  estadoBadgeClass,
  fmtDate,
  fmtDateTime,
  fmtMoney,
} from "@/lib/facturas";
import { saveFacturaDetail } from "../../actions";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      <span style={{ fontSize: "11.5px", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </span>
      <span style={{ fontSize: "14px", color: "var(--text)" }}>{value}</span>
    </div>
  );
}

export default async function FacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let factura;
  try {
    factura = await getFactura(id);
  } catch {
    notFound();
  }
  if (!factura) notFound();

  const [desglose, mail] = await Promise.all([
    getDesglose(factura.id),
    getMailOrigen(factura.email_message_id),
  ]);

  const d = destinoBadge(factura.destino);
  const isIntranet = factura.destino === "intranet";
  const isSoftland = factura.destino === "softland";

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link href="/dashboard" style={{ color: "var(--text-tertiary)", display: "flex" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13,4 7,10 13,16" />
          </svg>
        </Link>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
          {factura.proveedor_nombre}
        </h1>
        <span className={`badge ${d.cls}`}>
          <span className="dot" />
          {d.label}
        </span>
        <span className={`badge ${estadoBadgeClass(factura.estado)}`}>
          <span className="dot" />
          {factura.estado}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Field label="CUIT" value={factura.cuit} />
            <Field
              label="Comprobante"
              value={`${factura.tipo_comprobante ? factura.tipo_comprobante + " " : ""}${factura.numero_comprobante}`}
            />
            <Field label="Fecha emisión" value={fmtDate(factura.fecha_emision)} />
            <Field label="Fecha vencimiento" value={fmtDate(factura.fecha_vencimiento)} />
            <Field label="Condición de venta" value={factura.condicion_venta ?? "—"} />
            <Field
              label="Monto"
              value={`${factura.moneda !== "ARS" ? factura.moneda + " " : "$"}${fmtMoney(factura.monto)}`}
            />
            {factura.moneda !== "ARS" && (
              <Field label="Monto (ARS)" value={`$${fmtMoney(factura.monto_ars)}`} />
            )}
            <Field label="Obra" value={factura.obra ?? "—"} />
          </div>

          {desglose.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px 0", fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                Desglose de IVA
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Alícuota</th>
                    <th style={{ textAlign: "right" }}>Neto</th>
                    <th style={{ textAlign: "right" }}>IVA</th>
                  </tr>
                </thead>
                <tbody>
                  {desglose.map((row) => (
                    <tr key={row.id}>
                      <td>{row.alicuota}</td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {fmtMoney(row.neto)}
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {fmtMoney(row.iva)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isIntranet && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Correo de origen</div>
              {mail ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Field label="Asunto" value={mail.asunto ?? "—"} />
                  <Field label="Remitente" value={mail.remitente ?? "—"} />
                  <Field label="Recibido" value={fmtDateTime(mail.recibido_en)} />
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>
                  No se encontró el mail de origen vinculado a esta factura.
                </p>
              )}
              {factura.nota_completa && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                  }}
                >
                  {factura.nota_completa}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Editar</div>
          <form
            action={saveFacturaDetail.bind(null, factura.id)}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="estado-input" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                Estado
              </label>
              <input
                id="estado-input"
                type="text"
                name="estado"
                defaultValue={factura.estado}
                className="dropdown"
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="uop-input" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                UOP
              </label>
              <input
                id="uop-input"
                type="number"
                name="uop"
                defaultValue={factura.uop ?? undefined}
                placeholder="Sin UOP"
                style={{
                  padding: "8px 10px",
                  fontSize: "13px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              />
              <span style={{ fontSize: "11.5px", color: "var(--text-tertiary)" }}>
                Si corregís la UOP, el Portal la recuerda como la habitual de este proveedor para la
                próxima vez que no haya referencia.
              </span>
            </div>
            {factura.fuente_uop && (
              <Field label="Origen de la UOP" value={factura.fuente_uop} />
            )}
            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              Guardar cambios
            </button>
          </form>

          {isSoftland && (
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: 0, borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              Esta factura se anota manualmente en Softland. Confirmá su registración desde la sección
              Softland una vez cargada.
            </p>
          )}

          {factura.onedrive_url && (
            <a
              href={factura.onedrive_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ alignSelf: "flex-start" }}
            >
              Ver PDF original
            </a>
          )}
        </div>
      </div>
    </>
  );
}
