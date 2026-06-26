import { useState } from 'react'
import { campaign as initialCampaign } from './data/campaign.js'
import DonationStats from './components/DonationStats.jsx'
import DonationList from './components/DonationList.jsx'
import DonateModal from './components/DonateModal.jsx'

export default function App() {
  // El estado de la campaña vive aquí. Cuando conectes tu backend, puedes
  // cargar estos datos con un useEffect + fetch en lugar del import estático.
  const [campaign, setCampaign] = useState(initialCampaign)
  const [showModal, setShowModal] = useState(false)

  // Simula registrar una donación actualizando el estado local.
  // Reemplaza esto por la respuesta real de tu API/pasarela de pago.
  function handleConfirmDonation({ amount, name, message }) {
    setCampaign((prev) => ({
      ...prev,
      raised: prev.raised + amount,
      donorsCount: prev.donorsCount + 1,
      recentDonations: [
        {
          id: Date.now(),
          name,
          amount,
          message,
          date: new Date().toISOString().slice(0, 10),
        },
        ...prev.recentDonations,
      ],
    }))
    setShowModal(false)
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
