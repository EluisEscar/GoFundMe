import { useState, useEffect, useCallback } from 'react'
import {
  fetchDonations,
  actOnDonation,
  fetchCampaign,
  updateCampaignConfig,
} from '../lib/api.js'
import { formatCurrency, progressPercent, timeAgo } from '../utils/format.js'

const TABS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobadas' },
  { key: 'rejected', label: 'Rechazadas' },
]

// Panel de administración (ruta /#admin). Pide una contraseña, muestra un
// resumen de la campaña, permite editar título/meta y gestionar las donaciones
// (aprobar, rechazar y deshacer) organizadas por estado en pestañas.
export default function AdminPanel({ currency = 'PEN', fallback = {} }) {
  const [password, setPassword] = useState(
    () => sessionStorage.getItem('admin_pw') || ''
  )
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('pending')
  const [list, setList] = useState([]) // donaciones de la pestaña activa
  const [pendingCount, setPendingCount] = useState(0)
  const [totals, setTotals] = useState(null) // { raised, donors, goal, title }
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [loading, setLoading] = useState(false)

  // Edición de campaña
  const [editTitle, setEditTitle] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [editOrganizer, setEditOrganizer] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editStory, setEditStory] = useState('')
  const [configInit, setConfigInit] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState('')

  const load = useCallback(async (pw, which, silent = false) => {
    if (!silent) setLoading(true)
    try {
      // Pedimos todo en paralelo: pendientes (para el contador), la pestaña
      // activa y los totales de la campaña. Así no hay viajes en cadena.
      const needsActive = which !== 'pending'
      const [pendingData, activeData] = await Promise.all([
        fetchDonations(pw, 'pending'),
        needsActive ? fetchDonations(pw, which) : Promise.resolve(null),
      ])
      setPendingCount(pendingData.donations.length)
      setList(needsActive ? activeData.donations : pendingData.donations)
      setAuthed(true)
      setError('')
      sessionStorage.setItem('admin_pw', pw)
      fetchCampaign()
        .then((c) =>
          setTotals({
            raised: c.raised,
            donors: c.donors,
            goal: c.goal,
            title: c.title,
            organizer: c.organizer,
            location: c.location,
            story: c.story,
          })
        )
        .catch(() => {})
    } catch (e) {
      setAuthed(false)
      setError(e.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Entrada directa si ya había contraseña guardada.
  useEffect(() => {
    if (password) load(password, 'pending')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recarga al cambiar de pestaña + refresco automático (este último silencioso
  // para no parpadear el indicador de carga cada 10 segundos).
  useEffect(() => {
    if (!authed) return
    load(password, tab)
    const id = setInterval(() => load(password, tab, true), 10000)
    return () => clearInterval(id)
  }, [authed, tab, password, load])

  // Inicializa los campos de edición cuando llegan los totales. Si la base de
  // datos aún no tiene un campo, usamos el valor por defecto (campaign.js) como
  // punto de partida para no aparecer en blanco.
  useEffect(() => {
    if (totals && !configInit) {
      const fbStory = Array.isArray(fallback.story)
        ? fallback.story.join('\n')
        : fallback.story || ''
      setEditTitle(totals.title || fallback.title || '')
      setEditGoal(String(totals.goal || fallback.goal || ''))
      setEditOrganizer(totals.organizer || fallback.organizer || '')
      setEditLocation(totals.location || fallback.location || '')
      setEditStory(totals.story || fbStory)
      setConfigInit(true)
    }
  }, [totals, configInit, fallback])

  async function handleAction(id, action) {
    setBusyId(id)
    try {
      await actOnDonation(password, id, action)
      // Quitamos el ítem de la lista actual (cambió de estado).
      setList((cur) => cur.filter((d) => d.id !== id))
      load(password, tab) // refresca contadores y totales
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleSaveConfig(e) {
    e.preventDefault()
    setSavingConfig(true)
    setConfigMsg('')
    try {
      await updateCampaignConfig(password, {
        title: editTitle,
        goal: Number(editGoal),
        organizer: editOrganizer,
        location: editLocation,
        story: editStory,
      })
      setConfigMsg('Guardado ✓')
      load(password, tab)
      setTimeout(() => setConfigMsg(''), 2500)
    } catch (e) {
      setConfigMsg(e.message)
    } finally {
      setSavingConfig(false)
    }
  }

  function logout() {
    sessionStorage.removeItem('admin_pw')
    setPassword('')
    setAuthed(false)
    setList([])
    setTotals(null)
    setConfigInit(false)
  }

  // ---- Pantalla de login ----
  if (!authed) {
    return (
      <div className="admin-login">
        <form
          className="card admin-login__card"
          onSubmit={(e) => {
            e.preventDefault()
            load(password, 'pending')
          }}
        >
          <h1 className="section-title">Panel de administración</h1>
          <p className="admin-login__hint">
            Ingresa la contraseña para gestionar las donaciones.
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
          <span className="admin-stat__value">{pendingCount}</span>
          <span className="admin-stat__sub">por validar</span>
        </div>
      </div>

      {/* Editar título y meta */}
      <form className="card admin-config" onSubmit={handleSaveConfig}>
        <h2 className="section-title">Editar campaña</h2>
        <label className="field-label" htmlFor="cfg-title">
          Título
        </label>
        <input
          id="cfg-title"
          className="input"
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Título de la campaña"
        />
        <label className="field-label" htmlFor="cfg-goal">
          Meta ({currency})
        </label>
        <input
          id="cfg-goal"
          className="input"
          type="number"
          min="1"
          value={editGoal}
          onChange={(e) => setEditGoal(e.target.value)}
          placeholder="30000"
        />
        <label className="field-label" htmlFor="cfg-organizer">
          Organiza
        </label>
        <input
          id="cfg-organizer"
          className="input"
          type="text"
          value={editOrganizer}
          onChange={(e) => setEditOrganizer(e.target.value)}
          placeholder="Nombre de quien organiza"
        />
        <label className="field-label" htmlFor="cfg-location">
          Ubicación
        </label>
        <input
          id="cfg-location"
          className="input"
          type="text"
          value={editLocation}
          onChange={(e) => setEditLocation(e.target.value)}
          placeholder="Lima, Perú"
        />
        <label className="field-label" htmlFor="cfg-story">
          Sobre esta causa
        </label>
        <textarea
          id="cfg-story"
          className="input"
          rows="6"
          value={editStory}
          onChange={(e) => setEditStory(e.target.value)}
          placeholder="Cuenta la historia de la campaña. Deja una línea en blanco entre párrafos."
        />
        <p className="admin-config__hint">
          Cada salto de línea crea un párrafo nuevo en la página.
        </p>
        <div className="admin-config__foot">
          <button
            className="btn btn--primary btn--sm"
            type="submit"
            disabled={savingConfig}
          >
            {savingConfig ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {configMsg && <span className="admin-config__msg">{configMsg}</span>}
        </div>
      </form>

      {/* Pestañas por estado */}
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab ${tab === t.key ? 'is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'pending' && pendingCount > 0 && (
              <span className="admin-tab__badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="card admin__empty">
          <p className="donations__empty">Cargando…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="card admin__empty">
          <p className="donations__empty">
            {tab === 'pending'
              ? 'No hay donaciones pendientes 🎉'
              : tab === 'approved'
                ? 'Aún no hay donaciones aprobadas.'
                : 'No hay donaciones rechazadas.'}
          </p>
        </div>
      ) : (
        <ul className="admin__list">
          {list.map((d) => (
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
                {tab === 'pending' && (
                  <>
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
                  </>
                )}
                {tab !== 'pending' && (
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={busyId === d.id}
                    onClick={() => handleAction(d.id, 'reset')}
                  >
                    Deshacer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
