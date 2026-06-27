import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase para el lado servidor (Vercel Functions).
// Usa la SERVICE ROLE KEY, que ignora RLS. NUNCA la expongas al navegador.
export function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

// Lee y parsea el cuerpo JSON de la petición (Vercel ya lo hace en req.body,
// pero esto lo deja a prueba de balas si llega como string).
export function readBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}
