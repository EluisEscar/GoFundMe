import { getSupabase, readBody } from './_lib/supabase.js'

// API de administración (protegida con contraseña).
// La contraseña se envía en la cabecera "x-admin-password" y se compara con
// la variable de entorno ADMIN_PASSWORD.
//   GET  /api/admin?status=pending|approved|rejected  -> lista por estado
//   POST /api/admin  { id, action: 'approve' | 'reject' | 'reset' }
//   POST /api/admin  { config: { title, goal } }       -> edita la campaña
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

  // ---------------------------- LISTAR POR ESTADO ----------------------------
  if (req.method === 'GET') {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status)
      ? req.query.status
      : 'pending'

    const { data, error } = await supabase
      .from('donations')
      .select('id, name, amount, message, method, status, created_at, approved_at')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ donations: data ?? [] })
  }

  // ---------------------------- POST ----------------------------
  if (req.method === 'POST') {
    const body = readBody(req)

    // --- Editar configuración de la campaña (título / meta) ---
    if (body.config) {
      const patch = {}
      if (typeof body.config.title === 'string') {
        patch.title = body.config.title.trim().slice(0, 200)
      }
      if (body.config.goal != null) {
        const goal = Number(body.config.goal)
        if (!goal || goal <= 0) {
          return res.status(400).json({ error: 'Meta inválida' })
        }
        patch.goal = goal
      }
      if (typeof body.config.organizer === 'string') {
        patch.organizer = body.config.organizer.trim().slice(0, 200)
      }
      if (typeof body.config.location === 'string') {
        patch.location = body.config.location.trim().slice(0, 200)
      }
      if (typeof body.config.story === 'string') {
        patch.story = body.config.story.slice(0, 5000)
      }
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: 'Nada que actualizar' })
      }
      patch.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('campaign_config')
        .update(patch)
        .eq('id', 1)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    // --- Aprobar / Rechazar / Deshacer / Eliminar una donación ---
    const { id, action } = body
    if (!id || !['approve', 'reject', 'reset', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Petición inválida' })
    }

    // Eliminar borra la fila definitivamente.
    if (action === 'delete') {
      const { error } = await supabase.from('donations').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    let patch
    if (action === 'approve') {
      patch = { status: 'approved', approved_at: new Date().toISOString() }
    } else if (action === 'reject') {
      patch = { status: 'rejected', approved_at: null }
    } else {
      // reset: vuelve a pendiente (deshacer una aprobación o rechazo)
      patch = { status: 'pending', approved_at: null }
    }

    const { error } = await supabase.from('donations').update(patch).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Método no permitido' })
}
