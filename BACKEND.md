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
| `GET` | `/api/admin` | Lista pendientes | `x-admin-password` |
| `POST` | `/api/admin` | `{ id, action: approve\|reject }` | `x-admin-password` |

## Fase 2 — Automatizar la detección de ingresos (opcional)

BCP **no notifica los ingresos por correo de forma confiable**, así que el
scraping de email no sirve para detectar donaciones. La vía real en Perú es
capturar la **notificación push de Yape** en un Android y reenviarla a un
webhook:

1. App lectora de notificaciones (MacroDroid/Tasker o servicios como Yapay)
   detecta *"Te yapeó S/ X — Nombre"*.
2. Hace `POST` a un endpoint `/api/webhook/yape` (por crear) con monto y nombre.
3. El webhook crea la donación (pendiente o auto-aprobada) usando `external_id`
   para evitar duplicados.

Alternativa con webhook oficial y nombre verificado (cobra ~2.95%):
Culqi / Izipay / Yape Empresa / Mercado Pago.
