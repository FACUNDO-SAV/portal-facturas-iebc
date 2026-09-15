-- Portal de Facturas IEBC — esquema Postgres (Supabase)
-- Reemplaza a "CLAUDE for-Excel FACTURAS.xlsm" como fuente de verdad.
-- Diseñado para que /correo, /derivar y registrar-factura escriban acá
-- vía la API REST autogenerada de Supabase (PostgREST), sin necesitar
-- Excel ni el puente al dispositivo del usuario.

-- ============================================================
-- 1. CATÁLOGOS FIJOS — reemplazan la hoja "Cuentas" (que en realidad
--    empaqueta tres catálogos distintos en un solo sheet con columnas
--    salteadas: cuentas contables, códigos de IVA y tipos de comprobante)
-- ============================================================
create table cuentas_contables (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,              -- ej "4,2,1,03,06,05"
  descripcion text not null,
  uso text                                  -- ej "Pasivo — proveedor"
);

create table codigos_iva (
  codigo text primary key,                  -- ej "C21", "S21", "S00"
  descripcion text not null,
  alicuota numeric(5,4) not null,           -- ej 0.21
  origen text                               -- ej "Confirmado (NIF 729459)"
);

create table tipos_comprobante (
  tipo text primary key,                    -- "A", "B", "C", "Nota de Crédito", etc.
  descripcion text
);

-- ============================================================
-- 2. PROVEEDORES_RESUMEN — vista derivada, NO tabla (reemplaza hoja
--    "Proveedores", que en el Excel también se arma sola desde BD).
--    Se define al final del archivo, después de crear `facturas`,
--    porque agrega sobre esa tabla. Ver sección 6.
-- ============================================================

-- ============================================================
-- 3. FACTURAS — tabla central (reemplaza BD + Intranet + Softland +
--    Para revisar + NO FACTURA, unificadas por la columna `destino`)
-- ============================================================
create type destino_factura as enum ('intranet', 'softland', 'para_revisar', 'no_factura');

create table facturas (
  id uuid primary key default gen_random_uuid(),

  -- identificación / dedup
  cuit text not null,                       -- normalizado sin guiones; clave natural del proveedor
  proveedor_nombre text not null,           -- razón social tal cual viene en el PDF
  tipo_comprobante text,                    -- "A", "Nota de Crédito", etc. (ver tipos_comprobante)
  numero_comprobante text not null,
  clave_dedup text generated always as (cuit || '|' || numero_comprobante) stored,

  -- datos del comprobante
  moneda text not null default 'ARS',
  monto numeric(16,2) not null,
  monto_ars numeric(16,2),                  -- equivalente en pesos cuando moneda <> 'ARS' (usa TC del comprobante)
  fecha_emision date,
  fecha_vencimiento date,
  condicion_venta text,
  cae text,
  cae_vencimiento date,
  tiene_adjunto boolean not null default false,

  -- ruteo (equivalente a "en qué hoja vivía")
  destino destino_factura not null,
  uop integer,
  uop_sugerida integer,
  obra text,                                -- nombre/descr. de la obra si UOP la tiene asociada
  fuente_uop text,                          -- de dónde salió: PDF / cuerpo del mail / nombre de archivo / antecedente
  estado text not null,                     -- valores válidos dependen de `destino`, ver check abajo

  -- softland: desglose simple embebido (una alícuota típica); el detalle
  -- multi-alícuota va en facturas_iva_desglose
  cuenta_gasto text,
  cod_iva text,
  cuadra text,                              -- '✓' | 'faltan datos' | otro texto libre
  imputacion text,
  percepciones numeric(16,2),
  no_gravado numeric(16,2),
  exento numeric(16,2),
  tc numeric(12,5),

  -- trazabilidad
  nota_completa text,
  onedrive_url text,
  email_message_id text,                    -- internetMessageId del mail de origen
  alertas text[] not null default '{}',     -- semáforo de Control: array de strings

  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- Estados reales confirmados contra el Excel en producción (15/09/2026).
  -- Softland usa "Anotada ✓", NO "Cargada ✓" como en Intranet — son
  -- circuitos distintos, ojo si se copia lógica de uno a otro.
  constraint estado_valido check (
    (destino = 'intranet' and estado in ('Pendiente de ingreso','Pendiente de cargar','Cargada ✓','En duda')) or
    (destino = 'softland' and estado in ('Pendiente de anotar','Anotada ✓','En duda')) or
    (destino = 'para_revisar' and estado in ('Pendiente de UOP','Resuelta ✓','Derivar','No es factura')) or
    (destino = 'no_factura' and estado in ('Sin acción requerida','Pendiente de revisar','Derivado'))
  )
);

-- Dedup real: no puede haber dos facturas activas con mismo CUIT+número
-- (duplicado exacto ya se descarta antes de insertar, pero esto es la red de seguridad)
create unique index facturas_dedup_uk on facturas (clave_dedup) where destino <> 'no_factura';

create index facturas_cuit_idx on facturas (cuit);
create index facturas_estado_idx on facturas (destino, estado);
create index facturas_vencimiento_idx on facturas (fecha_vencimiento);

-- ============================================================
-- 4. FACTURAS_IVA_DESGLOSE — detalle multi-alícuota (Softland)
-- ============================================================
create table facturas_iva_desglose (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references facturas(id) on delete cascade,
  alicuota text not null,                   -- "21%", "10,5%", "0%"
  neto numeric(16,2) not null,
  iva numeric(16,2) not null
);

-- ============================================================
-- 5. MAILS_PROCESADOS — ledger de idempotencia (reemplaza confiar en isRead de Outlook)
-- ============================================================
-- Clave del rediseño: antes /correo dependía de que Outlook marque isRead
-- correctamente, lo cual demostró ser ambiguo entre sesiones. Ahora cada
-- corrida (programada o manual) chequea esta tabla ANTES de procesar un mail,
-- y lo registra ACÁ (no en Outlook) al terminar. Idempotente y sin
-- dependencia del estado del buzón.
create table mails_procesados (
  id uuid primary key default gen_random_uuid(),
  internet_message_id text not null unique,
  asunto text,
  remitente text,
  recibido_en timestamptz,
  procesado_en timestamptz not null default now(),
  resultado text not null,                  -- 'facturas_cargadas' | 'no_factura' | 'no_legible' | 'sin_adjunto' | 'ya_estaba'
  facturas_generadas uuid[] default '{}',   -- ids en `facturas`, si generó alguna
  notas text
);

create index mails_procesados_message_id_idx on mails_procesados (internet_message_id);

-- ============================================================
-- 6. PROVEEDORES_RESUMEN — vista (reemplaza la hoja "Proveedores").
--    En el Excel esta hoja "se arma sola desde BD" — acá hacemos lo mismo
--    con una vista en vez de una tabla que haya que mantener sincronizada.
-- ============================================================
create view proveedores_resumen as
select
  cuit,
  (array_agg(proveedor_nombre order by creado_en desc))[1] as proveedor_nombre,
  mode() within group (order by uop) filter (where uop is not null) as uop_habitual,
  array_agg(distinct uop) filter (where uop is not null) as uops_usadas,
  count(*) as cant_facturas,
  sum(monto_ars) filter (where moneda = 'ARS' or monto_ars is not null) as total_ars,
  max(fecha_emision) as ultima_factura,
  (array_agg(destino::text order by creado_en desc))[1] as hoja_habitual,
  case when count(*) = 1 then 'única factura previa' else 'UOP más repetida de ' || count(*) || ' facturas' end as criterio_uop,
  (array_agg(cuenta_gasto order by creado_en desc) filter (where cuenta_gasto is not null))[1] as cuenta_mas_reciente,
  (array_agg(cod_iva order by creado_en desc) filter (where cod_iva is not null))[1] as cod_iva_mas_reciente
from facturas
where destino <> 'no_factura'
group by cuit;

-- ============================================================
-- 7. Trigger genérico de actualizado_en
-- ============================================================
create or replace function set_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger trg_facturas_actualizado
  before update on facturas
  for each row execute function set_actualizado_en();

-- ============================================================
-- Fuera de alcance de esta primera etapa (correo + registro), a propósito:
-- las hojas "Registración" y "Referencia NIF" gobiernan el formato exacto
-- de asiento contable en Softland (transcripción de NIF reales) — eso
-- sigue viviendo en el Excel por ahora. También el Panel (dashboard) sigue
-- leyendo del Excel hasta que decidamos migrarlo a leer de esta base.
-- ============================================================
