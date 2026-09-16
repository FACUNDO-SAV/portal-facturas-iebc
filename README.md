# Portal de Facturas · iEBC

Web interno para el circuito de facturas de iEBC: centraliza lo que llega por correo (`facturaelect@iebc.com.ar`), lo que se carga automáticamente en el **Intranet**, lo que se anota a mano en **Softland**, y lo que queda **para revisar** por falta de UOP. Reemplaza la consulta manual del Excel de control por un panel único, sin dejar de alimentarse de la misma base de datos que lo nutre.

## Estado del proyecto

- **Migración histórica**: completa. 409 facturas y 144 filas de desglose de IVA migradas a Supabase (Postgres), junto con las tablas catálogo (`cuentas_contables`, `codigos_iva`, `tipos_comprobante`).
- **Excel (`CLAUDE for-Excel FACTURAS.xlsm`)**: se mantiene como backup del proceso de carga a Intranet — no se retira. El barrido de correo (skill `/correo`) sigue escribiendo ahí; el Portal lee de Supabase para dar visibilidad, no reemplaza esa carga.
- **Portal web**: en construcción activa sobre Next.js + Supabase, con acceso de un solo usuario por ahora (contraseña simple, sin registro de cuentas).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (config nativa en `globals.css`, sin `tailwind.config.js`)
- **Supabase** (Postgres) vía `@supabase/supabase-js`, usando la `service_role` key solo del lado del servidor
- Autenticación propia: contraseña + cookie de sesión firmada (HMAC-SHA256 vía Web Crypto), sin Supabase Auth — apropiado mientras el uso sea de una sola persona

## Reglas de negocio clave (ver `db/schema.sql`)

- `destino_factura` es uno de: `intranet`, `softland`, `para_revisar`, `no_factura`.
- Ruteo por UOP: **184, 413 o ≥ 1000 → Softland**; cualquier otra UOP → Intranet; sin UOP → Para revisar.
- **Softland usa el estado `"Anotada ✓"`** al confirmar la registración manual — **no** `"Cargada ✓"`, que es exclusivo del circuito de Intranet. Son circuitos distintos aunque se parezcan.
- `proveedores_resumen` es una vista (no tabla) que calcula `uop_habitual` con `mode()` sobre las UOP usadas por CUIT — es la base de la sugerencia de UOP en "Para revisar": cada corrección manual queda reflejada automáticamente la próxima vez, sin necesidad de una tabla aparte.

## Cómo correrlo en local

```bash
npm install
cp .env.example .env   # completar SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y PORTAL_PASSWORD
npm run dev
```

Abrir `http://localhost:3000` — redirige a `/login`. Las variables de entorno nunca deben commitearse (`.env` está en `.gitignore`).

## Estructura

```
src/
  app/
    login/            Página y server actions de login/logout
    (app)/             Shell autenticado (topbar + sidebar)
      dashboard/        KPIs + listado general con filtros
      intranet/         Facturas de carga automática
      softland/         Facturas de anotación manual + confirmación
      para-revisar/      Facturas sin UOP, con sugerencia por antecedente
      facturas/[id]/     Detalle: datos, desglose de IVA, correo de origen, edición
  lib/
    supabase.ts        Cliente server-only (service role)
    facturas.ts        Consultas y helpers de formato
    session.ts         Sesión por cookie firmada
  middleware.ts        Gate de autenticación
db/
  schema.sql           Esquema completo de Supabase
```

## Próximos pasos

- Definir cómo se despliega (Vercel conectado a este repo de GitHub es la vía más simple).
- Sumar más automatismos del skill `/correo` a la vista del Portal a medida que se necesiten.
