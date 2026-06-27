import { getSupabase, readBody } from './_lib/supabase.js'

// API de administración (protegida con contraseña).
// La contraseña se envía en la cabecera "x-admin-password" y se compara con
// la variable de entorno ADMIN_PASSWORD.
//   GET  /api/admin            -> lista las donaciones pendientes
//   POST /api/admin  { id, action: 'approve' | 'reject' }
export default async function handler(req, res) {
  const password = req.headers['x-admin-password']
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  let supabase
  try {
    supabase = getSupabase()
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }

  // ---------------------------- PENDIENTES ----------------------------
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('donations')
      .select('id, name, amount, message, method, op_number, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ donations: data ?? [] })
  }

  // ---------------------------- APROBAR / RECHAZAR ----------------------------
  if (req.method === 'POST') {
    const { id, action } = readBody(req)
    if (!id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Petición inválida' })
    }

    const patch =
      action === 'approve'
        ? { status: 'approved', approved_at: new Date().toISOString() }
        : { status: 'rejected' }

    const { error } = await supabase.from('donations').update(patch).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Método no permitido' })
}
