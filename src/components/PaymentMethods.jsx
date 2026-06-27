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

// Apartado de donación. Botones principales: Yape y "Transferencia / PayPal".
// Al abrir el segundo, aparecen dos sub-opciones (BCP y PayPal); al elegir una
// se muestran sus datos correspondientes.
export default function PaymentMethods({ methods, onSelect }) {
  const [open, setOpen] = useState(null) // 'yape' | 'bank' | null
  const [bankOpt, setBankOpt] = useState(null) // 'bcp' | 'paypal' | null
  const { yape, bankTransfer, paypal } = methods

  const toggleTop = (key) => {
    setOpen((cur) => (cur === key ? null : key))
    setBankOpt(null)
    if (key === 'yape' && onSelect) onSelect('yape')
  }

  const chooseBank = (opt) => {
    setBankOpt((cur) => (cur === opt ? null : opt))
    if (onSelect) onSelect(opt === 'paypal' ? 'paypal' : 'transferencia')
  }

  // ¿Hay al menos una opción de "transferencia / paypal" habilitada?
  const hasBankGroup = bankTransfer?.enabled || paypal?.enabled

  return (
    <div className="pay">
      <p className="pay__intro">Elige cómo quieres donar:</p>

      <div className="pay__buttons">
        {yape?.enabled && (
          <button
            type="button"
            className={`pay__method pay__method--yape ${open === 'yape' ? 'is-open' : ''}`}
            onClick={() => toggleTop('yape')}
            aria-expanded={open === 'yape'}
          >
            <span className="pay__method-icon">📱</span>
            <span>Yape</span>
          </button>
        )}

        {hasBankGroup && (
          <button
            type="button"
            className={`pay__method pay__method--bank ${open === 'bank' ? 'is-open' : ''}`}
            onClick={() => toggleTop('bank')}
            aria-expanded={open === 'bank'}
          >
            <span className="pay__method-icon">🏦</span>
            <span>Transferencia / PayPal</span>
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

      {/* Grupo: Transferencia / PayPal */}
      {open === 'bank' && hasBankGroup && (
        <div className="pay__detail">
          <p className="pay__hint">Elige el medio:</p>
          <div className="pay__suboptions">
            {bankTransfer?.enabled && (
              <button
                type="button"
                className={`pay__subbtn ${bankOpt === 'bcp' ? 'is-active' : ''}`}
                onClick={() => chooseBank('bcp')}
              >
                🏦 {bankTransfer.bank || 'Banco'}
              </button>
            )}
            {paypal?.enabled && (
              <button
                type="button"
                className={`pay__subbtn ${bankOpt === 'paypal' ? 'is-active' : ''}`}
                onClick={() => chooseBank('paypal')}
              >
                💳 PayPal
              </button>
            )}
          </div>

          {/* Datos del banco (BCP) */}
          {bankOpt === 'bcp' && bankTransfer?.enabled && (
            <div className="pay__subdetail">
              <p className="pay__hint">
                Transfiere desde tu banca y guarda el comprobante.
              </p>
              <CopyRow
                label={`Banco (${bankTransfer.currency})`}
                value={bankTransfer.bank}
              />
              <CopyRow label="Titular" value={bankTransfer.accountName} />
              <CopyRow label="N° de cuenta" value={bankTransfer.accountNumber} />
              <CopyRow label="CCI (interbancario)" value={bankTransfer.cci} />
            </div>
          )}

          {/* Datos de PayPal */}
          {bankOpt === 'paypal' && paypal?.enabled && (
            <div className="pay__subdetail">
              <p className="pay__hint">
                Ideal para donaciones desde el extranjero.
              </p>
              {paypal.link && (
                <a
                  className="btn btn--paypal btn--block"
                  href={paypal.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pagar con PayPal
                </a>
              )}
              {paypal.email && (
                <CopyRow label="Correo de PayPal" value={paypal.email} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
