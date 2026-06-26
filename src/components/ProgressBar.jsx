import { progressPercent } from '../utils/format.js'

// Barra de progreso que se llena según el porcentaje recaudado.
// La animación de llenado se hace con una transición de CSS sobre el width.
export default function ProgressBar({ raised, goal }) {
  const percent = progressPercent(raised, goal)

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percent}% de la meta recaudado`}
    >
      <div className="progress__bar" style={{ width: `${percent}%` }} />
    </div>
  )
}
