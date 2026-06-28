import { getSupabase } from '../_lib/supabase.js'

// =============================================================================
// Webhook de Yape (semi-automático)
// -----------------------------------------------------------------------------
// La idea: una app en tu celular Android (Automate / Tasker / MacroDroid) lee
// la notificación que envía Yape cuando RECIBES un pago y la reenvía aquí.
// Este endpoint registra la donación automáticamente.
//
//   POST /api/webhook/yape?token=SECRETO
//
// El contenido se acepta de forma flexible, en cualquiera de estas formas:
//   - JSON:        { "text": "...", "external_id": "..." }
//   - JSON:        { "amount": 20, "name": "Juan", "external_id": "..." }
//   - Formulario:  text=...&external_id=...
//   - Texto plano: (todo el cuerpo es el texto de la notificación)
//   - Query:       ?token=...&text=...&external_id=...
//
// Seguridad: se exige el token secreto (YAPE_WEBHOOK_SECRET) para que nadie
// más pueda inflar la barra con pagos falsos.
// =============================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // --- Autenticación por token secreto ---
  const secret = process.env.YAPE_WEBHOOK_SECRET
  const token = req.query.token || req.headers['x-webhook-token']
  if (!secret || token !== secret) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  // --- Lectura flexible del contenido (JSON / formulario / texto / query) ---
  const q = req.query || {}
  let parsed = {}
  const raw = req.body
  if (raw && typeof raw === 'object') {
    parsed = raw // JSON o formulario ya parseado por Vercel
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { text: raw } // texto plano: todo el cuerpo es la notificación
    }
  }

  const text = (parsed.text ?? q.text ?? '').toString()

  // --- Obtener monto: explícito o parseado del texto ---
  let amount = Number(parsed.amount ?? q.amount)
  if (!amount && text) amount = parseAmount(text)

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'No se pudo determinar el monto' })
  }

  // --- Nombre: explícito o parseado, con respaldo genérico ---
  let name = (parsed.name ?? q.name ?? '').toString().trim()
  if (!name && text) name = parseName(text)
  if (!name) name = 'Donación por Yape'

  // --- Idempotencia: evita registrar dos veces la misma notificación ---
  // La app debería enviar un external_id estable (id o fecha+hora de la
  // notificación). Si no llega, lo derivamos del texto + monto.
  const externalId =
    (parsed.external_id ?? parsed.externalId ?? q.external_id ?? '')
      .toString()
      .trim() || `yape:${amount}:${text}`.slice(0, 200)

  let supabase
  try {
    supabase = getSupabase()
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }

  // ¿Aprobar automáticamente? Por defecto sí: la notificación ES la prueba de
  // que el dinero llegó. Pon YAPE_WEBHOOK_AUTOAPPROVE=false para revisarlas a
  // mano en /#admin antes de que suban la barra.
  const autoApprove = process.env.YAPE_WEBHOOK_AUTOAPPROVE !== 'false'
  const status = autoApprove ? 'approved' : 'pending'

  const row = {
    name: name.slice(0, 120),
    amount,
    message: '',
    method: 'yape',
    status,
    source: 'yape_webhook',
    external_id: externalId,
  }
  if (autoApprove) row.approved_at = new Date().toISOString()

  const { error } = await supabase.from('donations').insert(row)

  if (error) {
    // 23505 = unique_violation → ya estaba registrada (idempotencia). OK.
    if (error.code === '23505') {
      return res.status(200).json({ ok: true, duplicate: true })
    }
    return res.status(500).json({ error: error.message })
  }

  return res.status(201).json({ ok: true, amount, name, status })
}

// Extrae el monto de un texto tipo "... S/ 20.00 ..." o "... S/20 ...".
function parseAmount(text) {
  const m = text.match(/S\/\s*([\d.,]+)/i)
  if (!m) return 0
  // Normaliza: quita separadores de miles y usa punto decimal.
  const raw = m[1].replace(/,/g, '')
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

// Intenta extraer el nombre del pagador (mejor esfuerzo).
// Formatos comunes: "... de Juan Pérez", "Juan Pérez te envió ...".
function parseName(text) {
  let m = text.match(/\bde\s+([A-Za-zÁÉÍÓÚÑáéíóúñ.\s]{2,40}?)(?:\s*[-–·.]|\s+por\b|$)/)
  if (m) return m[1].trim()
  m = text.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ.\s]{2,40}?)\s+te\s+(envió|yape)/i)
  if (m) return m[1].trim()
  // Formato "... - MARIA GONZALES" (nombre al final tras un guion).
  m = text.match(/[-–·]\s*([A-Za-zÁÉÍÓÚÑáéíóúñ.\s]{2,40})\s*$/)
  if (m) return m[1].trim()
  return ''
}
