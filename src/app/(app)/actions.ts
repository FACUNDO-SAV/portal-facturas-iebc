"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function confirmSoftland(facturaId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("facturas")
    .update({ estado: "Anotada ✓" })
    .eq("id", facturaId)
    .eq("destino", "softland");
  if (error) throw error;
  revalidatePath("/softland");
  revalidatePath("/dashboard");
}

function computeDestinoEstado(uop: number, fechaEmision: string | null) {
  const esSoftland = uop === 184 || uop === 413 || uop >= 1000;
  if (esSoftland) {
    return { destino: "softland" as const, estado: "Pendiente de anotar" };
  }
  const hoy = new Date().toISOString().slice(0, 10);
  const estado = fechaEmision === hoy ? "Pendiente de ingreso" : "Pendiente de cargar";
  return { destino: "intranet" as const, estado };
}

export async function routeParaRevisar(facturaId: string, formData: FormData) {
  const uopRaw = String(formData.get("uop") || "").trim();
  const uop = Number(uopRaw);
  if (!uopRaw || !Number.isFinite(uop)) {
    throw new Error("UOP inválida");
  }

  const supabase = getSupabaseAdmin();
  const { data: factura, error: readErr } = await supabase
    .from("facturas")
    .select("fecha_emision")
    .eq("id", facturaId)
    .single();
  if (readErr) throw readErr;

  const { destino, estado } = computeDestinoEstado(uop, factura.fecha_emision);

  const { error } = await supabase
    .from("facturas")
    .update({
      uop,
      destino,
      estado,
      fuente_uop: "Asignada manualmente en el Portal",
    })
    .eq("id", facturaId);
  if (error) throw error;

  revalidatePath("/para-revisar");
  revalidatePath("/dashboard");
  revalidatePath(`/facturas/${facturaId}`);
}

export async function saveFacturaDetail(facturaId: string, formData: FormData) {
  const estado = String(formData.get("estado") || "").trim();
  const uopRaw = String(formData.get("uop") || "").trim();
  const uop = uopRaw ? Number(uopRaw) : null;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("facturas")
    .update({
      estado,
      uop: uop !== null && Number.isFinite(uop) ? uop : null,
      fuente_uop: uop !== null ? "Corregida manualmente en el Portal" : undefined,
    })
    .eq("id", facturaId);
  if (error) throw error;

  revalidatePath(`/facturas/${facturaId}`);
  revalidatePath("/dashboard");
  revalidatePath("/intranet");
  revalidatePath("/softland");
  revalidatePath("/para-revisar");
}
