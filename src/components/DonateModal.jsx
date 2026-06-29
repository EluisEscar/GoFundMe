import { useState, useEffect } from 'react'
import { formatCurrency, thankYouMessage } from '../utils/format.js'
import PaymentMethods from './PaymentMethods.jsx'

// Modal de donación en tres pasos:
//   Paso 1: elegir monto, nombre y mensaje.
//   Paso 2: elegir método (Yape / Transferencia), ver los datos y poner el
//           número de operación.
//   Paso 3: confirmación (la donación queda pendiente de validación).
export default function DonateModal({ campaign, onClose, onConfirm }) {
  const { suggestedAmounts, currency, paymentMethods } = campaign
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState(suggestedAmounts[1] ?? 50)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [method, setMethod] = useState('otro')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Cerrar con la tecla Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function goToPayment(e) {
    e.preventDefault()
    if (Number(amount) > 0) setStep(2)
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError('')
    const ok = await onConfirm({
      amount: Number(amount),
      name: name.trim() || 'Anónimo',
      message: message.trim(),
      method,
    })
    setSubmitting(false)
    if (ok) setStep(3)
    else setError('No se pudo registrar. Revisa tu conexión e intenta de nuevo.')
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

        {/* -------------------- Paso 1: monto -------------------- */}
        {step === 1 && (
          <>
            <h2 id="donate-title" className="section-title">
              Haz tu donación
            </h2>
            <form onSubmit={goToPayment}>
              <label className="field-label">Elige un monto</label>
              <div className="amount-grid">
                {suggestedAmounts.map((a) => (
                  <button
                    type="button"
                    key={a}
                    className={`amount-chip ${Number(amount) === a ? 'is-active' : ''}`}
                    onClick={() => setAmount(a)}
                  >
                    <span className="amount-chip__badge">{thankYouMessage(a)}</span>
                    {formatCurrency(a, currency)}
                  </button>
                ))}
              </div>

              <label className="field-label" htmlFor="custom-amount">
                Otro monto
              </label>
              <input
                id="custom-amount"
                className="input"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                // Evita que la rueda del mouse cambie el monto al hacer scroll.
                onWheel={(e) => e.currentTarget.blur()}
              />
              {thankYouMessage(amount) && (
                <p className="thanks-live">{thankYouMessage(amount)}</p>
              )}

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
                Continuar
              </button>
            </form>
          </>
        )}

        {/* -------------------- Paso 2: método de pago -------------------- */}
        {step === 2 && (
          <>
            <button className="modal__back" onClick={() => setStep(1)}>
              ← Volver
            </button>
            <h2 id="donate-title" className="section-title">
              Donar {formatCurrency(Number(amount) || 0, currency)}
            </h2>

            <PaymentMethods methods={paymentMethods} onSelect={setMethod} />

            {error && <p className="form-error">{error}</p>}

            <button
              className="btn btn--primary btn--block"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? 'Enviando…' : 'Ya realicé mi donación'}
            </button>
            <p className="pay__note">
              Verificaremos tu aporte y aparecerá en la lista una vez confirmado.
            </p>
          </>
        )}

        {/* -------------------- Paso 3: confirmación -------------------- */}
        {step === 3 && (
          <div className="done">
            <div className="done__icon" aria-hidden="true">
              ✓
            </div>
            <h2 id="donate-title" className="section-title">
              ¡Gracias por tu apoyo! 💚
            </h2>
            <p className="done__text">
              Registramos tu donación de{' '}
              <strong>{formatCurrency(Number(amount) || 0, currency)}</strong>.
              La validaremos y aparecerá en las donaciones recientes muy pronto.
            </p>
            <button className="btn btn--primary btn--block" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
