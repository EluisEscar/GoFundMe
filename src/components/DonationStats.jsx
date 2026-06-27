import { useState } from 'react'
import ProgressBar from './ProgressBar.jsx'
import { formatCurrency, progressPercent } from '../utils/format.js'

// Tarjeta lateral con el monto recaudado, la barra de progreso, la meta,
// el número de donantes y los botones de donar y compartir.
export default function DonationStats({ campaign, onDonate }) {
  const { raised = 0, goal = 0, currency, donorsCount = 0 } = campaign
  const percent = progressPercent(raised, goal)
  const [shared, setShared] = useState(false)

  // Comparte el enlace de la campaña. En móviles usa el menú nativo
  // (navigator.share); si no está disponible, copia el link al portapapeles.
  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: campaign.title, url })
      } catch {
        // El usuario canceló el diálogo: no hacemos nada.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    } catch {
      // Si el navegador bloquea el portapapeles, no rompemos la UI.
    }
  }

  return (
    <aside className="stats card">
      <p className="stats__raised">
        <strong>{formatCurrency(raised, currency)}</strong>
        <span className="stats__goal">
          {' '}recaudados de {formatCurrency(goal, currency)}
        </span>
      </p>

      <ProgressBar raised={raised} goal={goal} />

      <div className="stats__meta">
        <span>{percent}% de la meta</span>
        <span>{donorsCount.toLocaleString('es-PE')} donaciones</span>
      </div>

      <button className="btn btn--primary btn--block" onClick={onDonate}>
        Donar ahora
      </button>
      <button className="btn btn--ghost btn--block" onClick={handleShare}>
        {shared ? '¡Enlace copiado!' : 'Compartir'}
      </button>
    </aside>
  )
}
