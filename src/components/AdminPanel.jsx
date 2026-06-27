import { useState, useEffect, useCallback } from 'react'
import { fetchPending, actOnDonation } from '../lib/api.js'
import { formatCurrency, timeAgo } from '../utils/format.js'

// Panel de administración (ruta /#admin). Pide una contraseña, lista las
// donaciones pendientes y permite aprobarlas o rechazarlas. La contraseña se
// guarda en sessionStorage para no pedirla en cada recarga de la sesión.
export default function AdminPanel({ currency = 'PEN' }) {
  const [password, setPassword] = useState(
    () => sessionStorage.getItem('admin_pw') || ''
  )
  const [authed, setAuthed] = useState(false)
  const [pending, setPending] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async (pw) => {
    try {
      const data = await fetchPending(pw)
      setPending(data.donations || [])
      setAuthed(true)
      setError('')
      sessionStorage.setItem('admin_pw', pw)
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
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
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

  // ---- Lista de pendientes ----
  return (
    <div className="container admin">
      <div className="admin__head">
        <h1 className="section-title">Donaciones pendientes</h1>
        <span className="admin__count">{pending.length}</span>
      </div>

      {error && <p className="form-error">{error}</p>}

      {pending.length === 0 ? (
        <p className="donations__empty">No hay donaciones pendientes 🎉</p>
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
                {d.op_number && (
                  <p className="admin-item__op">Operación: {d.op_number}</p>
                )}
                {d.message && (
                  <p className="admin-item__msg">"{d.message}"</p>
                )}
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
