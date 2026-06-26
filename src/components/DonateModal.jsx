import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/format.js'

// Modal para capturar una donación.
// Por ahora solo muestra el flujo de UI; cuando conectes tu lógica,
// reemplaza el contenido de handleSubmit por la llamada a tu backend/pasarela.
export default function DonateModal({ campaign, onClose, onConfirm }) {
  const { suggestedAmounts, currency } = campaign
  const [amount, setAmount] = useState(suggestedAmounts[1] ?? 500)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  // Cerrar con la tecla Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: aquí va tu lógica (pasarela de pago / API).
    onConfirm({ amount: Number(amount), name: name.trim() || 'Anónimo', message: message.trim() })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="donate-title" className="section-title">
          Haz tu donación
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Elige un monto</label>
          <div className="amount-grid">
            {suggestedAmounts.map((a) => (
              <button
                type="button"
                key={a}
                className={`amount-chip ${Number(amount) === a ? 'is-active' : ''}`}
                onClick={() => setAmount(a)}
              >
                {formatCurrency(a, currency)}
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="custom-amount">
            Otro monto ({currency})
          </label>
          <input
            id="custom-amount"
            className="input"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <label className="field-label" htmlFor="donor-name">
            Tu nombre (opcional)
          </label>
          <input
            id="donor-name"
            className="input"
            type="text"
            placeholder="Anónimo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="field-label" htmlFor="donor-message">
            Mensaje (opcional)
          </label>
          <textarea
            id="donor-message"
            className="input"
            rows="2"
            placeholder="Deja un mensaje de apoyo"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button type="submit" className="btn btn--primary btn--block">
            Donar {formatCurrency(Number(amount) || 0, currency)}
          </button>
        </form>
      </div>
    </div>
  )
}
