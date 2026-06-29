// Botón flotante de WhatsApp. Abre un chat con un mensaje prellenado.
// Si no hay número configurado, no se muestra nada.
export default function WhatsappButton({ phone, message }) {
  if (!phone) return null

  const text = encodeURIComponent(
    message || 'Hola, tengo una consulta sobre la campaña de donación.'
  )
  const href = `https://wa.me/${phone}?text=${text}`

  return (
    <a
      className="wa-fab"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
    >
      <svg
        className="wa-fab__icon"
        viewBox="0 0 32 32"
        width="28"
        height="28"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M16.04 4C9.96 4 5 8.95 5 15.02c0 2.13.62 4.11 1.69 5.79L5 28l7.36-1.65a11 11 0 0 0 3.68.63h.01c6.07 0 11.03-4.95 11.03-11.02C27.08 8.95 22.12 4 16.04 4Zm0 19.96h-.01c-1.13 0-2.24-.3-3.2-.88l-.23-.14-3.82.86.82-3.72-.15-.24a9.13 9.13 0 0 1-1.4-4.86c0-5.05 4.12-9.16 9.18-9.16 2.45 0 4.75.96 6.48 2.69a9.1 9.1 0 0 1 2.68 6.48c0 5.05-4.12 9.21-9.13 9.21Zm5.03-6.86c-.27-.14-1.63-.8-1.88-.9-.25-.09-.43-.13-.62.14-.18.27-.71.9-.87 1.08-.16.18-.32.2-.59.07-.27-.14-1.16-.43-2.21-1.36-.82-.73-1.37-1.63-1.53-1.9-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.46.09-.18.05-.34-.02-.48-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.98 2.66 1.12 2.84.14.18 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.58.66.21 1.25.18 1.72.11.53-.08 1.63-.67 1.86-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.18-.52-.32Z"
        />
      </svg>
      <span className="wa-fab__text">¿Dudas? Escríbenos</span>
    </a>
  )
}
