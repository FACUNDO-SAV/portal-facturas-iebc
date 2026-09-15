# Portal de Facturas IEBC

Backend en Supabase (Postgres) para el circuito de facturas de IEBC. Reemplaza a
`CLAUDE for-Excel FACTURAS.xlsm` como fuente de verdad para las automatizaciones
`/correo`, `/derivar` y `registrar-factura`. El Excel se mantiene como backup
del proceso de carga en Intranet.

## Estado actual (septiembre 2026)

- ✅ Esquema aplicado en Supabase (`db/schema.sql`): tablas `facturas`,
  `facturas_iva_desglose`, `cuentas_contables`, `codigos_iva`, `tipos_comprobante`.
- ✅ Migración histórica completa: 409 facturas, 144 filas de desglose de IVA,
  y los catálogos (64 cuentas contables, 7 códigos de IVA, 9 tipos de
  comprobante) cargados desde el Excel a Supabase.
- ⬜ App/portal web (frontend + capa de datos) que lea y escriba contra este
  esquema — todavía no construida.
- ⬜ Actualización de los skills `/correo`, `/derivar` y `registrar-factura`
  para leer/escribir en Supabase en lugar del `.xlsm`.

## Estructura del repo

```
db/
  schema.sql       # Esquema completo aplicado en Supabase
scripts/           # Scripts de migración / utilidades (vacío por ahora)
.env.example       # Variables de entorno necesarias (sin valores)
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (o una key con menos privilegios para el
  frontend, según el diseño final de autenticación)

`.env` está en `.gitignore` y nunca debe subirse al repo.

## Próximos pasos

1. Definir stack, autenticación y pantallas del Portal web.
2. Construir la app (lectura/escritura contra Supabase).
3. Migrar los skills de automatización para que dejen de depender del Excel.
