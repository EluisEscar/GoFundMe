import { useState, useEffect, useCallback } from 'react'
import { fetchPending, actOnDonation, fetchCampaign } from '../lib/api.js'
import { formatCurrency, progressPercent, timeAgo } from '../utils/format.js'

// Panel de administración (ruta /#admin). Pide una contraseña, muestra un
// resumen de la campaña y la lista de donaciones pendientes para aprobar o
// rechazar. La contraseña se guarda en sessionStorage para no pedirla en cada
// recarga de la sesión.
export default function AdminPanel({ currency = 'PEN' }) {
  const [password, setPassword] = useState(
    () => sessionStorage.getItem('admin_pw') || ''
  )
  const [authed, setAuthed] = useState(false)
  const [pending, setPending] = useState([])
  const [totals, setTotals] = useState(null) // { raised, donors, goal }
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async (pw) => {
    try {
      const data = await fetchPending(pw)
      setPending(data.donations || [])
      setAuthed(true)
      setError('')
      sessionStorage.setItem('admin_pw', pw)
      // Totales de la campaña (recaudado / donantes / meta) para el resumen.
      fetchCampaign()
        .then((c) =>
          setTotals({ raised: c.raised, donors: c.donors, goal: c.goal })
        )
        .catch(() => {})
    } catch (e) {
      setAuthed(false)
      setError(e.message)
    }
  }, [])

  // Si ya había contraseña guardada, intenta entrar directo.
  useEffect(() => {
    if (password) load(password)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresco automático mientras está autenticado.
  useEffect(() => {
    if (!authed) return
    const id = setInterval(() => load(password), 10000)
    return () => clearInterval(id)
  }, [authed, password, load])

  async function handleAction(id, action) {
    setBusyId(id)
    try {
      await actOnDonation(password, id, action)
      setPending((cur) => cur.filter((d) => d.id !== id))
      // Refrescamos totales tras aprobar (sube el recaudado).
      if (action === 'approve') {
        fetchCampaign()
          .then((c) =>
            setTotals({ raised: c.raised, donors: c.donors, goal: c.goal })
          )
          .catch(() => {})
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  function logout() {
    sessionStorage.removeItem('admin_pw')
    setPassword('')
    setAuthed(false)
    setPending([])
    setTotals(null)
  }

  // ---- Pantalla de login ----
  if (!authed) {
    return (
      <div className="admin-login">
        <form
          className="card admin-login__card"
          onSubmit={(e) => {
            e.preventDefault()
            load(password)
          }}
        >
          <h1 className="section-title">Panel de administración</h1>
          <p className="admin-login__hint">
            Ingresa la contraseña para revisar las donaciones pendientes.
          </p>
          <input
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary btn--block" type="submit">
            Entrar
          </button>
        </form>
      </div>
    )
  }

  // Monto total en cola (suma de las donaciones pendientes).
  const pendingTotal = pending.reduce((sum, d) => sum + Number(d.amount), 0)
  const percent = totals ? progressPercent(totals.raised, totals.goal) : 0

  // ---- Dashboard ----
  return (
    <div className="container admin">
      <div className="admin__bar">
        <h1 className="admin__title">Panel de administración</h1>
        <button className="btn btn--ghost btn--sm" onClick={logout}>
          Cerrar sesión
        </button>
      </div>

      {/* Resumen de la campaña */}
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__label">Recaudado</span>
          <span className="admin-stat__value">
            {totals ? formatCurrency(totals.raised, currency) : '—'}
          </span>
          {totals && (
            <span className="admin-stat__sub">
              {percent}% de {formatCurrency(totals.goal, currency)}
            </span>
          )}
        </div>
        <div className="admin-stat">
          <span className="admin-stat__label">Donaciones</span>
          <span className="admin-stat__value">
            {totals ? totals.donors : '—'}
          </span>
          <span className="admin-stat__sub">aprobadas</span>
        </div>
        <div className="admin-stat admin-stat--accent">
          <span className="admin-stat__label">Pendientes</span>
          <span className="admin-stat__value">{pending.length}</span>
          <span className="admin-stat__sub">
            {formatCurrency(pendingTotal, currency)} por validar
          </span>
        </div>
      </div>

      <div className="admin__head">
        <h2 className="section-title">Donaciones pendientes</h2>
      </div>

      {error && <p className="form-error">{error}</p>}

      {pending.length === 0 ? (
        <div className="card admin__empty">
          <p className="donations__empty">No hay donaciones pendientes 🎉</p>
        </div>
      ) : (
        <ul className="admin__list">
          {pending.map((d) => (
            <li key={d.id} className="card admin-item">
              <div className="admin-item__info">
                <p className="admin-item__top">
                  <strong>{formatCurrency(Number(d.amount), currency)}</strong>
                  <span className="admin-item__method">{d.method}</span>
                </p>
                <p className="admin-item__name">{d.name}</p>
                {d.message && <p className="admin-item__msg">"{d.message}"</p>}
                <p className="admin-item__date">{timeAgo(d.created_at)}</p>
              </div>
              <div className="admin-item__actions">
                <button
                  className="btn btn--primary btn--sm"
                  disabled={busyId === d.id}
                  onClick={() => handleAction(d.id, 'approve')}
                >
                  Aprobar
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={busyId === d.id}
                  onClick={() => handleAction(d.id, 'reject')}
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
