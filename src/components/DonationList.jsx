import { formatCurrency, timeAgo } from '../utils/format.js'

// Lista de donaciones recientes (prueba social).
export default function DonationList({ donations, currency }) {
  if (!donations || donations.length === 0) {
    return (
      <div className="donations card">
        <h2 className="section-title">Donaciones recientes</h2>
        <p className="donations__empty">Aún no hay donaciones. ¡Sé el primero!</p>
      </div>
    )
  }

  return (
    <div className="donations card">
      <h2 className="section-title">Donaciones recientes</h2>
      <ul className="donations__list">
        {donations.map((d) => (
          <li key={d.id} className="donation">
            <div className="donation__avatar" aria-hidden="true">
              {d.name.charAt(0).toUpperCase()}
            </div>
            <div className="donation__body">
              <p className="donation__head">
                <span className="donation__name">{d.name}</span>
                <span className="donation__amount">
                  {formatCurrency(d.amount, currency)}
                </span>
              </p>
              <p className="donation__sub">
                {timeAgo(d.date)}
                {d.message ? ` · ${d.message}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
