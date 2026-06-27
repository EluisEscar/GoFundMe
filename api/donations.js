import { getSupabase, readBody } from './_lib/supabase.js'

// API pública de donaciones.
//   GET  /api/donations  -> totales (aprobadas) + lista de donaciones recientes
//   POST /api/donations  -> registra una donación nueva en estado "pendiente"
export default async function handler(req, res) {
  let supabase
  try {
    supabase = getSupabase()
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }

  // ---------------------------- LISTAR ----------------------------
  if (req.method === 'GET') {
    const [totals, recent, config] = await Promise.all([
      supabase.from('campaign_totals').select('raised, donors').single(),
      supabase
        .from('donations')
        .select('id, name, amount, message, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('campaign_config')
        .select('title, goal, organizer, location, story')
        .eq('id', 1)
        .single(),
    ])

    if (totals.error || recent.error || config.error) {
      const err = totals.error || recent.error || config.error
      return res.status(500).json({ error: err.message })
    }

    return res.status(200).json({
      raised: Number(totals.data?.raised ?? 0),
      donors: Number(totals.data?.donors ?? 0),
      goal: Number(config.data?.goal ?? 0),
      title: config.data?.title ?? '',
      organizer: config.data?.organizer ?? '',
      location: config.data?.location ?? '',
      story: config.data?.story ?? '',
      donations: recent.data ?? [],
    })
  }

  // ---------------------------- REGISTRAR ----------------------------
  if (req.method === 'POST') {
    const body = readBody(req)
    const amount = Number(body.amount)
    const name = (body.name || '').toString().trim() || 'Anónimo'
    const message = (body.message || '').toString().trim().slice(0, 280)
    const method = ['yape', 'transferencia', 'otro'].includes(body.method)
      ? body.method
      : 'otro'
    const opNumber = (body.op_number || '').toString().trim().slice(0, 60)

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' })
    }

    const { error } = await supabase.from('donations').insert({
      name,
      amount,
      message,
      method,
      op_number: opNumber || null,
      status: 'pending',
      source: 'self_report',
    })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Método no permitido' })
}
