import { useState } from 'react'

// Pequeña fila de "dato + botón copiar".
function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Si el navegador bloquea el portapapeles, no rompemos la UI.
    }
  }

  return (
    <div className="copy-row">
      <div className="copy-row__text">
        <span className="copy-row__label">{label}</span>
        <span className="copy-row__value">{value}</span>
      </div>
      <button type="button" className="copy-row__btn" onClick={copy}>
        {copied ? '¡Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}

// Apartado de donación: un par de botones (Yape / Transferencia) que, al
// hacer clic, despliegan los datos de pago correspondientes.
export default function PaymentMethods({ methods }) {
  const [open, setOpen] = useState(null) // 'yape' | 'bank' | null
  const { yape, bankTransfer } = methods

  const toggle = (key) => setOpen((cur) => (cur === key ? null : key))

  return (
    <div className="pay">
      <p className="pay__intro">Elige cómo quieres donar:</p>

      <div className="pay__buttons">
        {yape?.enabled && (
          <button
            type="button"
            className={`pay__method pay__method--yape ${open === 'yape' ? 'is-open' : ''}`}
            onClick={() => toggle('yape')}
            aria-expanded={open === 'yape'}
          >
            <span className="pay__method-icon">📱</span>
            <span>Yape</span>
          </button>
        )}

        {bankTransfer?.enabled && (
          <button
            type="button"
            className={`pay__method pay__method--bank ${open === 'bank' ? 'is-open' : ''}`}
            onClick={() => toggle('bank')}
            aria-expanded={open === 'bank'}
          >
            <span className="pay__method-icon">🏦</span>
            <span>Transferencia bancaria</span>
          </button>
        )}
      </div>

      {/* Detalle: Yape */}
      {open === 'yape' && yape?.enabled && (
        <div className="pay__detail">
          {yape.qrImage ? (
            <img className="pay__qr" src={yape.qrImage} alt="Código QR de Yape" />
          ) : (
            <p className="pay__hint">
              Yapea al número y coloca tu nombre en el mensaje 🙌
            </p>
          )}
          <CopyRow label="Número de Yape" value={yape.phone} />
          <CopyRow label="A nombre de" value={yape.holder} />
        </div>
      )}

      {/* Detalle: Transferencia bancaria */}
      {open === 'bank' && bankTransfer?.enabled && (
        <div className="pay__detail">
          <p className="pay__hint">
            Transfiere desde tu banca y guarda el comprobante.
          </p>
          <CopyRow label={`Banco (${bankTransfer.currency})`} value={bankTransfer.bank} />
          <CopyRow label="Titular" value={bankTransfer.accountName} />
          <CopyRow label="N° de cuenta" value={bankTransfer.accountNumber} />
          <CopyRow label="CCI (interbancario)" value={bankTransfer.cci} />
        </div>
      )}
    </div>
  )
}
