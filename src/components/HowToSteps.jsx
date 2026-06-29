// Sección "Cómo donar en 3 pasos" — pensada para que cualquier persona
// (incluso poco familiarizada con apps) entienda el proceso de un vistazo.
export default function HowToSteps({ onDonate }) {
  const steps = [
    {
      n: 1,
      title: 'Toca "Donar ahora"',
      text: 'Elige cuánto quieres aportar. Tú decides el monto.',
    },
    {
      n: 2,
      title: 'Escanea el QR o copia el número',
      text: 'Paga con Yape, Plin o transferencia. Te mostramos los datos.',
    },
    {
      n: 3,
      title: '¡Listo! Tu aporte cuenta',
      text: 'Validamos tu donación y aparecerá en la lista muy pronto.',
    },
  ]

  return (
    <div className="how card">
      <h2 className="section-title">¿Cómo donar? Es muy fácil</h2>
      <ol className="how__list">
        {steps.map((s) => (
          <li key={s.n} className="how__step">
            <span className="how__num" aria-hidden="true">
              {s.n}
            </span>
            <div className="how__body">
              <p className="how__title">{s.title}</p>
              <p className="how__text">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <button className="btn btn--primary btn--block btn--lg" onClick={onDonate}>
        Donar ahora
      </button>
    </div>
  )
}
