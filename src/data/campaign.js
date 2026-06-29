export const campaign = {
  // --- Información principal ---
  title: 'Ayúdanos a recuperar la vista de Luchito',
  organizer: 'Asociación Vecinal Los Pinos',
  location: 'Lima, Perú',
  createdAt: '2026-06-01',

  // --- Imagen de portada ---
  coverImage:
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',

  // --- Meta y recaudación ---
  currency: 'PEN', 
  locale: 'es-PE',

  // --- Montos sugeridos para el botón de donar ---
  suggestedAmounts: [10, 20, 50, 100],

  // ---------------------------------------------------------------------------
  // MÉTODOS DE PAGO
  // ---------------------------------------------------------------------------
  paymentMethods: {
    yape: {
      enabled: true,
      holder: 'Esteban L. Escarcena Torres',
      phone: '979325027',
      qrImage: '/yape-qr.svg',
    },
    bankTransfer: {
      enabled: true,
      bank: 'BCP',
      accountName: 'Esteban L. Escarcena Torres',
      accountNumber: '193-12345678-0-99',
      cci: '002-193-001234567800-99',
      currency: 'Soles (S/)',
    },
    paypal: {
      enabled: true,
      // Correo asociado a tu cuenta de PayPal.
      email: 'tucorreo@ejemplo.com',
      // Enlace de PayPal.me (opcional). Si lo dejas vacío, solo se muestra el correo.
      link: 'https://paypal.me/tuusuario',
    },
  },
}
