import ProgressBar from './ProgressBar.jsx'
import { formatCurrency, progressPercent } from '../utils/format.js'

// Tarjeta lateral con el monto recaudado, la barra de progreso, la meta,
// el número de donantes y el botón principal para donar.
export default function DonationStats({ campaign, onDonate }) {
  const { raised, goal, currency, donorsCount } = campaign
  const percent = progressPercent(raised, goal)

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
        <span>{donorsCount.toLocaleString('es-MX')} donaciones</span>
      </div>

      <button className="btn btn--primary btn--block" onClick={onDonate}>
        Donar ahora
      </button>
      <button className="btn btn--ghost btn--block" onClick={onDonate}>
        Compartir
      </button>
    </aside>
  )
}
