-- =============================================================================
-- Esquema de base de datos (Supabase / PostgreSQL)
-- -----------------------------------------------------------------------------
-- Cómo aplicarlo:
--   1. Crea un proyecto en https://supabase.com
--   2. Ve a "SQL Editor" → "New query"
--   3. Pega este archivo completo y pulsa "Run".
-- =============================================================================

-- Extensión para generar UUIDs (suele venir activa en Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabla principal de donaciones
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Anónimo',
  amount      numeric(10, 2) not null check (amount > 0),
  message     text not null default '',
  method      text not null default 'yape'
                check (method in ('yape', 'plin', 'transferencia', 'paypal', 'otro')),
  op_number   text,                 -- número de operación / constancia
  voucher_url text,                 -- (opcional) imagen del comprobante
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  source      text not null default 'self_report'
                check (source in ('self_report', 'yape_webhook', 'manual')),
  external_id text unique,          -- idempotencia (id de notificación/webhook)
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists donations_status_created_idx
  on public.donations (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Configuración de la campaña (una sola fila)
-- ---------------------------------------------------------------------------
create table if not exists public.campaign_config (
  id         int primary key default 1 check (id = 1),
  title      text not null default 'Campaña',
  goal       numeric(12, 2) not null default 50000,
  organizer  text not null default '',
  location   text not null default '',
  story      text not null default '',  -- párrafos separados por saltos de línea
  updated_at timestamptz not null default now()
);

-- Si la tabla ya existía, agregamos las columnas nuevas (seguro re-ejecutar).
alter table public.campaign_config add column if not exists organizer text not null default '';
alter table public.campaign_config add column if not exists location  text not null default '';
alter table public.campaign_config add column if not exists story     text not null default '';

insert into public.campaign_config (id, title, goal)
  values (1, 'Ayúdanos a reconstruir la escuela del barrio', 50000)
  on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Vista con los totales (solo donaciones aprobadas)
-- ---------------------------------------------------------------------------
create or replace view public.campaign_totals as
  select
    coalesce(sum(amount), 0)::numeric(12, 2) as raised,
    count(*)::int                            as donors
  from public.donations
  where status = 'approved';

-- ---------------------------------------------------------------------------
-- Seguridad: activamos RLS para bloquear el acceso anónimo directo.
-- El backend (Vercel) usa la SERVICE ROLE KEY, que ignora RLS. El navegador
-- nunca habla con Supabase directamente: siempre pasa por nuestra API.
-- ---------------------------------------------------------------------------
alter table public.donations      enable row level security;
alter table public.campaign_config enable row level security;
