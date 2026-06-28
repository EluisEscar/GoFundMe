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

## Fase 2 — Semi-automatizar Yape con Automate (Android, gratis)

Cuando **recibes** un Yape, tu celular muestra una notificación. La idea es leer
esa notificación con **Automate** (de LlamaLab, gratis y sin suscripción) y
reenviarla al webhook para que la donación se registre sola.

> Solo funciona en **Android** (iPhone no deja leer notificaciones de otras
> apps). El celular debe estar encendido y con datos/wifi.

### 1. Configura el secreto en Vercel
Añade en **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `YAPE_WEBHOOK_SECRET` | una cadena larga y aleatoria (tu "llave") |
| `YAPE_WEBHOOK_AUTOAPPROVE` | `true` (sube la barra solo) o `false` (revisar en /#admin) |

Vuelve a desplegar.

### 2. Instala Automate y crea un flujo (flow)
1. Instala **Automate** (Play Store) y dale permiso de **acceso a
   notificaciones** (te lo pedirá al usar el primer bloque).
2. Crea un flujo nuevo con estos bloques, conectados en orden:

   **a) Bloque "Flow beginning"** (viene por defecto).

   **b) Bloque "Notification on posted"** (disparador):
   - En *Application(s)* elige **Yape** (paquete `com.bcp.innovacxion.yapeapp`).
   - Esto deja disponibles variables como `text` (el texto de la notificación),
     `key` y `postTime` (un identificador y la hora).

   **c) Bloque "HTTP request"**:
   - Method: **POST**
   - URL: pega esto (cambiando tu sitio y tu secreto):
     ```
     https://tu-sitio.vercel.app/api/webhook/yape?token=TU_SECRETO&external_id=
     ```
     y al final, **concatena la variable** `postTime` (o `key`) para el
     external_id. En el campo URL de Automate puedes escribir:
     ```
     "https://tu-sitio.vercel.app/api/webhook/yape?token=TU_SECRETO&external_id=" + postTime
     ```
   - **Request content type:** `text/plain`
   - **Request body:** la variable `text` (el texto crudo de la notificación).
     No necesitas formatear JSON: el webhook acepta el texto plano tal cual.

   **d) Conecta la salida del bloque HTTP de vuelta al bloque "Notification on
   posted"** para que siga escuchando los siguientes pagos.

3. Pulsa **Start** (▶) en el flujo y déjalo corriendo.

El webhook saca el **monto** del texto (`S/ 20.00`) y, si puede, el **nombre**
del pagador. El `external_id` (la hora del pago) evita duplicados.

### 3. Prueba
Pídele a alguien que te yapee S/ 1 (o háztelo tú). En segundos la donación debe
aparecer en `/#admin` (y subir la barra si `AUTOAPPROVE=true`).

- **Idempotencia:** el `external_id` evita que la misma notificación se registre
  dos veces.
- **Seguridad:** sin el `token` correcto el webhook responde 401.

> El webhook es flexible: acepta el contenido como **texto plano**, **JSON**,
> **formulario** o **query string**. Así funciona con Automate, Tasker,
> MacroDroid o cualquier app que haga un POST.

> Alternativa "oficial" sin depender del celular (cobra ~2.95% de comisión):
> Mercado Pago / Culqi / Izipay / Yape Empresa.
