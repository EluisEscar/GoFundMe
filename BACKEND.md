# Backend — Donaciones con validación manual

Este proyecto incluye un backend ligero (Vercel Functions + Supabase) para
registrar donaciones, aprobarlas manualmente y que la barra de progreso suba
sola en la web.

## Arquitectura

```
Donante → Web (React) → POST /api/donations  → Supabase (status: pending)
                                                      │
Tú (admin) → /#admin → GET/POST /api/admin ──────────┘  (aprobar / rechazar)
                                                      │
Web (React) ← GET /api/donations (cada 12s) ←─────────┘  (solo aprobadas)
```

- El navegador **nunca** habla con Supabase directamente: todo pasa por `/api`.
- Las funciones usan la **service role key** (secreta, solo en el servidor).

## Puesta en marcha (una sola vez)

### 1. Crear la base de datos en Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, pega el contenido de `supabase/schema.sql` y
   pulsa **Run**.
3. En **Project Settings → API** copia:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (¡la secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configurar variables de entorno en Vercel
En tu proyecto de Vercel → **Settings → Environment Variables**, añade:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | la Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | la service_role key |
| `ADMIN_PASSWORD` | una contraseña fuerte para el panel admin |

Vuelve a desplegar para que tomen efecto.

### 3. Probar
- Abre la web, dona → debe quedar "pendiente" (no sube la barra todavía).
- Entra a `https://tu-sitio.vercel.app/#admin`, pon la contraseña, **aprueba**
  la donación → la barra sube en ~12s.

## Desarrollo local

Para correr las funciones de `/api` en local necesitas la CLI de Vercel:

```bash
npm i -g vercel
cp .env.example .env   # rellena tus valores
vercel dev             # levanta front + /api juntos
```

> Con `npm run dev` (Vite solo) la web funciona, pero `/api` no responde: la
> página cae al modo demo con los datos de `src/data/campaign.js`.

## Endpoints

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/donations` | Totales + donaciones aprobadas | — |
| `POST` | `/api/donations` | Registra una donación (pendiente) | — |
| `GET` | `/api/admin?status=` | Lista por estado (pending/approved/rejected) | `x-admin-password` |
| `POST` | `/api/admin` | `{ id, action }` o `{ config }` | `x-admin-password` |
| `POST` | `/api/webhook/yape` | Registra un Yape recibido (semi-auto) | `token` |

## Fase 2 — Semi-automatizar Yape con MacroDroid (Android)

Cuando **recibes** un Yape, tu celular muestra una notificación. La idea es leer
esa notificación con **MacroDroid** y reenviarla al webhook para que la donación
se registre sola.

> Solo funciona en **Android** (iPhone no deja leer notificaciones de otras
> apps). El celular debe estar encendido y con datos/wifi.

### 1. Configura el secreto en Vercel
Añade en **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `YAPE_WEBHOOK_SECRET` | una cadena larga y aleatoria (tu "llave") |
| `YAPE_WEBHOOK_AUTOAPPROVE` | `true` (sube la barra solo) o `false` (revisar en /#admin) |

Vuelve a desplegar.

### 2. Instala MacroDroid y crea una macro
1. Instala **MacroDroid** (Play Store) y dale permiso de **acceso a
   notificaciones**.
2. Crea una macro nueva:
   - **Disparador (Trigger):** *Notificación recibida* → app **Yape**.
   - **Acción (Action):** *Petición HTTP / HTTP Request*:
     - Método: **POST**
     - URL: `https://tu-sitio.vercel.app/api/webhook/yape?token=TU_SECRETO`
     - Tipo de contenido: **application/json**
     - Cuerpo:
       ```json
       { "text": "[notification_text]", "external_id": "[notification_id]" }
       ```
       (`[notification_text]` y `[notification_id]` son "magic text" que
       MacroDroid reemplaza por el contenido real de la notificación.)

El webhook saca el **monto** del texto (`S/ 20.00`) y, si puede, el **nombre**.
También puedes mandar `amount` y `name` por separado si logras extraerlos con el
magic text de MacroDroid (más preciso).

### 3. Prueba
Pídele a alguien que te yapee S/ 1 (o háztelo tú). En segundos la donación debe
aparecer en `/#admin` (y subir la barra si `AUTOAPPROVE=true`).

- **Idempotencia:** el `external_id` evita que la misma notificación se registre
  dos veces.
- **Seguridad:** sin el `token` correcto el webhook responde 401.

> Alternativa "oficial" con nombre verificado y webhook real (cobra ~2.95% de
> comisión): Culqi / Izipay / Yape Empresa / Mercado Pago.
