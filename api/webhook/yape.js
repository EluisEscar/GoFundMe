import { getSupabase, readBody } from '../_lib/supabase.js'

// =============================================================================
// Webhook de Yape (semi-automático)
// -----------------------------------------------------------------------------
// La idea: una app en tu celular Android (MacroDroid / Tasker) lee la
// notificación que envía Yape cuando RECIBES un pago y la reenvía aquí.
// Este endpoint registra la donación automáticamente.
//
//   POST /api/webhook/yape?token=SECRETO
//   body (cualquiera de estas dos formas):
//     { "amount": 20, "name": "Juan Pérez", "external_id": "123..." }
//     { "text": "Has recibido un pago de S/ 20.00 de Juan Pérez", "external_id": "..." }
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

  const body = readBody(req)

  // --- Obtener monto: explícito o parseado del texto ---
  let amount = Number(body.amount)
  const text = (body.text || '').toString()
  if (!amount && text) amount = parseAmount(text)

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'No se pudo determinar el monto' })
  }

  // --- Nombre: explícito o parseado, con respaldo genérico ---
  let name = (body.name || '').toString().trim()
  if (!name && text) name = parseName(text)
  if (!name) name = 'Donación por Yape'

  // --- Idempotencia: evita registrar dos veces la misma notificación ---
  // MacroDroid debería enviar un external_id estable (id o fecha+hora de la
  // notificación). Si no llega, lo derivamos del texto + monto.
  const externalId =
    (body.external_id || body.externalId || '').toString().trim() ||
    `yape:${amount}:${text}`.slice(0, 200)

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
