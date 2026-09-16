import { getSupabaseAdmin } from "./supabase";

export type Destino = "intranet" | "softland" | "para_revisar" | "no_factura";

export type Factura = {
  id: string;
  cuit: string;
  proveedor_nombre: string;
  tipo_comprobante: string | null;
  numero_comprobante: string;
  moneda: string;
  monto: number;
  monto_ars: number | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  condicion_venta: string | null;
  destino: Destino;
  uop: number | null;
  uop_sugerida: number | null;
  obra: string | null;
  fuente_uop: string | null;
  estado: string;
  nota_completa: string | null;
  onedrive_url: string | null;
  email_message_id: string | null;
  actualizado_en: string;
  creado_en: string;
};

export type Desglose = { id: string; alicuota: string; neto: number; iva: number };

export type MailOrigen = {
  internet_message_id: string;
  asunto: string | null;
  remitente: string | null;
  recibido_en: string | null;
};

export type ProveedorResumen = {
  cuit: string;
  proveedor_nombre: string;
  uop_habitual: number | null;
  uops_usadas: number[] | null;
  cant_facturas: number;
  total_ars: number | null;
  ultima_factura: string | null;
  hoja_habitual: string | null;
  criterio_uop: string | null;
};

export async function listFacturas(opts: {
  destino?: Destino;
  estado?: string;
  search?: string;
  limit?: number;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("facturas")
    .select("*")
    .order("fecha_emision", { ascending: false, nullsFirst: false });

  if (opts.destino) query = query.eq("destino", opts.destino);
  if (opts.estado) query = query.eq("estado", opts.estado);
  if (opts.search) {
    const s = opts.search.replace(/[%,]/g, "").trim();
    if (s) query = query.or(`proveedor_nombre.ilike.%${s}%,cuit.ilike.%${s}%`);
  }
  query = query.limit(opts.limit ?? 200);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Factura[];
}

export async function getFactura(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("facturas").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Factura;
}

export async function getDesglose(facturaId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("facturas_iva_desglose")
    .select("*")
    .eq("factura_id", facturaId)
    .order("alicuota");
  if (error) throw error;
  return (data ?? []) as Desglose[];
}

export async function getMailOrigen(messageId: string | null) {
  if (!messageId) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("mails_procesados")
    .select("internet_message_id, asunto, remitente, recibido_en")
    .eq("internet_message_id", messageId)
    .maybeSingle();
  return (data ?? null) as MailOrigen | null;
}

export async function getProveedorResumen(cuit: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("proveedores_resumen")
    .select("*")
    .eq("cuit", cuit)
    .maybeSingle();
  return (data ?? null) as ProveedorResumen | null;
}

export async function getKpis() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  // Fecha_emision is a plain date column — compare as YYYY-MM-DD strings,
  // not creado_en (row insert time), so a bulk historical import doesn't
  // get miscounted as "this month" just because it happened to run now.
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const startStr = toDateStr(startOfMonth);
  const endStr = toDateStr(startOfNextMonth);

  const [totalMesRes, pendUopRes, pendIntranetRes, pendSoftlandRes, monthRowsRes] =
    await Promise.all([
      supabase
        .from("facturas")
        .select("id", { count: "exact", head: true })
        .neq("destino", "no_factura")
        .gte("fecha_emision", startStr)
        .lt("fecha_emision", endStr),
      supabase
        .from("facturas")
        .select("id", { count: "exact", head: true })
        .eq("destino", "para_revisar")
        .eq("estado", "Pendiente de UOP"),
      supabase
        .from("facturas")
        .select("id", { count: "exact", head: true })
        .eq("destino", "intranet")
        .in("estado", ["Pendiente de cargar", "Pendiente de ingreso"]),
      supabase
        .from("facturas")
        .select("id", { count: "exact", head: true })
        .eq("destino", "softland")
        .eq("estado", "Pendiente de anotar"),
      supabase
        .from("facturas")
        .select("monto, monto_ars, moneda")
        .neq("destino", "no_factura")
        .gte("fecha_emision", startStr)
        .lt("fecha_emision", endStr),
    ]);

  const montoTotalArs = (monthRowsRes.data ?? []).reduce((acc, r) => {
    const v = r.moneda === "ARS" ? Number(r.monto) : Number(r.monto_ars ?? 0);
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);

  return {
    totalMes: totalMesRes.count ?? 0,
    pendUop: pendUopRes.count ?? 0,
    pendIntranet: pendIntranetRes.count ?? 0,
    pendSoftland: pendSoftlandRes.count ?? 0,
    montoTotalArs,
  };
}

export async function getNavCounts() {
  const supabase = getSupabaseAdmin();
  const [intranetRes, softlandRes, revisarRes] = await Promise.all([
    supabase
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("destino", "intranet")
      .in("estado", ["Pendiente de cargar", "Pendiente de ingreso"]),
    supabase
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("destino", "softland")
      .eq("estado", "Pendiente de anotar"),
    supabase
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("destino", "para_revisar")
      .eq("estado", "Pendiente de UOP"),
  ]);
  return {
    intranet: intranetRes.count ?? 0,
    softland: softlandRes.count ?? 0,
    paraRevisar: revisarRes.count ?? 0,
  };
}

export function fmtMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  if (Number.isNaN(date.getTime())) return d;
  return new Intl.DateTimeFormat("es-AR").format(date);
}

export function fmtDateTime(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function estadoBadgeClass(estado: string) {
  if (estado === "Cargada ✓" || estado === "Anotada ✓") return "badge-green";
  if (estado === "Pendiente de UOP") return "badge-red";
  if (estado.startsWith("Pendiente")) return "badge-amber";
  if (estado === "En duda" || estado === "Derivar") return "badge-amber";
  return "badge-slate";
}

export function destinoBadge(destino: Destino) {
  switch (destino) {
    case "intranet":
      return { label: "Intranet", cls: "badge-blue" };
    case "softland":
      return { label: "Softland", cls: "badge-info" };
    case "no_factura":
      return { label: "No factura", cls: "badge-slate" };
    default:
      return { label: "Para revisar", cls: "badge-red" };
  }
}
