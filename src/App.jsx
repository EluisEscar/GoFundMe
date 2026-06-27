import { useState, useEffect, useCallback } from 'react'
import { campaign as initialCampaign } from './data/campaign.js'
import { fetchCampaign, submitDonation } from './lib/api.js'
import DonationStats from './components/DonationStats.jsx'
import DonationList from './components/DonationList.jsx'
import DonateModal from './components/DonateModal.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  // Partimos de los datos demo (contenido + respaldo). Los números (recaudado,
  // donantes, donaciones recientes) se sobrescriben con lo que devuelva la API.
  const [campaign, setCampaign] = useState(initialCampaign)
  const [showModal, setShowModal] = useState(false)
  const [route, setRoute] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  )

  // Enrutado mínimo por hash: /#admin abre el panel de administración.
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Trae los datos vivos desde la API. Si falla (p. ej. backend aún no
  // configurado), se mantiene el contenido demo para que la página no se rompa.
  const loadCampaign = useCallback(async () => {
    try {
      const data = await fetchCampaign()
      // La historia viaja como texto (párrafos separados por saltos de línea).
      const storyParas = (data.story || '')
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean)
      setCampaign((prev) => ({
        ...prev,
        title: data.title || prev.title,
        goal: data.goal || prev.goal,
        organizer: data.organizer || prev.organizer,
        location: data.location || prev.location,
        story: storyParas.length ? storyParas : prev.story,
        raised: data.raised,
        donorsCount: data.donors,
        recentDonations: (data.donations || []).map((d) => ({
          id: d.id,
          name: d.name,
          amount: Number(d.amount),
          message: d.message,
          date: (d.created_at || '').slice(0, 10),
        })),
      }))
    } catch {
      // Sin backend: seguimos con los datos demo.
    }
  }, [])

  // Carga inicial + sondeo cada 12s para que la barra suba sola al aprobarse.
  useEffect(() => {
    loadCampaign()
    const id = setInterval(loadCampaign, 12000)
    return () => clearInterval(id)
  }, [loadCampaign])

  // Registra la donación (queda pendiente de aprobación). Devuelve true/false
  // para que el modal muestre el estado de éxito o error.
  async function handleConfirmDonation(payload) {
    try {
      await submitDonation(payload)
      return true
    } catch {
      return false
    }
  }

  // Panel de administración: se muestra al entrar con /#admin
  if (route === '#admin') {
    return (
      <AdminPanel currency={campaign.currency} fallback={initialCampaign} />
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="container topbar__inner">
          <span className="brand">
            <span className="brand__dot" /> RecaudaYa
          </span>
          <button className="btn btn--primary btn--sm" onClick={() => setShowModal(true)}>
            Donar
          </button>
        </div>
      </header>

      <main className="container layout">
        <section className="content">
          <h1 className="campaign-title">{campaign.title}</h1>
          <p className="campaign-meta">
            Organiza <strong>{campaign.organizer}</strong> · {campaign.location}
          </p>

          <div className="cover">
            <img src={campaign.coverImage} alt={campaign.title} loading="lazy" />
          </div>

          <div className="story card">
            <h2 className="section-title">Sobre esta causa</h2>
            {campaign.story.map((p, i) => (
              <p key={i} className="story__p">
                {p}
              </p>
            ))}
          </div>
        </section>

        <DonationStats campaign={campaign} onDonate={() => setShowModal(true)} />

        <DonationList
          donations={campaign.recentDonations}
          currency={campaign.currency}
        />
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            Cada aporte nos acerca a la meta de recuperar tu vista y mejorar tu calidad de vida. 
            ¡Gracias por tu apoyo!
          </p>
        </div>
      </footer>

      {showModal && (
        <DonateModal
          campaign={campaign}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmDonation}
        />
      )}
    </div>
  )
}
