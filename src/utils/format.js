// Utilidades de formato de números y moneda.

export function formatCurrency(amount, currency = 'PEN', locale = 'es-PE') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Devuelve el porcentaje recaudado, limitado entre 0 y 100.
export function progressPercent(raised, goal) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((raised / goal) * 100)))
}

// Tramos de agradecimiento según el monto donado.
// Cada tramo aplica hasta su valor `max` (inclusive). El último (max: Infinity)
// cubre cualquier monto mayor. Ajusta rangos y textos a tu gusto.
export const THANK_YOU_TIERS = [
  { max: 10, message: '¡Gracias! 💚' },
  { max: 20, message: '¡Muchas gracias! 💚' },
  { max: 50, message: '¡Muchísimas gracias! 🙌' },
  { max: 100, message: '¡Mil gracias! 🌟' },
  { max: Infinity, message: '¡Eres un héroe! 🏆' },
]

// Devuelve el mensaje de agradecimiento correspondiente a un monto.
export function thankYouMessage(amount) {
  const a = Number(amount) || 0
  if (a <= 0) return ''
  const tier = THANK_YOU_TIERS.find((t) => a <= t.max)
  return tier ? tier.message : ''
}

// "hace 3 días", etc. — formato relativo simple en español.
export function timeAgo(dateString, now = new Date()) {
  const date = new Date(dateString)
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 30) return `hace ${diffDays} días`
  const months = Math.floor(diffDays / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}
