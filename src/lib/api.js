// Cliente HTTP del frontend hacia nuestra API en Vercel (/api/*).

const BASE = '/api'

// Trae los totales y las donaciones aprobadas para pintar la barra y la lista.
export async function fetchCampaign() {
  const res = await fetch(`${BASE}/donations`)
  if (!res.ok) throw new Error('No se pudo cargar la campaña')
  return res.json()
}

// Registra una donación (queda en estado "pendiente" hasta que se apruebe).
export async function submitDonation(payload) {
  const res = await fetch(`${BASE}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo registrar la donación')
  }
  return res.json()
}

// --- Administración (requieren contraseña) ---

export async function fetchPending(password) {
  const res = await fetch(`${BASE}/admin`, {
    headers: { 'x-admin-password': password },
  })
  if (res.status === 401) throw new Error('Contraseña incorrecta')
  if (!res.ok) throw new Error('No se pudieron cargar las pendientes')
  return res.json()
}

export async function actOnDonation(password, id, action) {
  const res = await fetch(`${BASE}/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify({ id, action }),
  })
  if (!res.ok) throw new Error('No se pudo actualizar la donación')
  return res.json()
}
