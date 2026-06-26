// =============================================================================
// DATOS DE LA CAMPAÑA
// -----------------------------------------------------------------------------
// Este archivo concentra toda la información de la campaña en un solo lugar.
// Cuando tengas tu lógica/backend, reemplaza estos valores por los que vengan
// de tu API (por ejemplo con fetch dentro de un useEffect en App.jsx).
//
// Los montos están en la moneda que definas en `currency`.
// =============================================================================

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
  goal: 30000, // Meta total a recaudar
  raised: 0, // Monto recaudado hasta ahora
  currency: 'PEN', // Soles peruanos (S/)
  locale: 'es-PE',
  donorsCount: 0,

  // --- Descripción (acepta varios párrafos) ---
  story: [
    'Hace tres meses, una tormenta dañó gravemente el techo y las aulas de la escuela primaria de nuestra comunidad. Más de 200 niños se quedaron sin un espacio seguro para estudiar.',
    'Con tu ayuda queremos reconstruir las aulas, reemplazar el mobiliario y volver a abrir las puertas antes del próximo ciclo escolar. Cada aporte, por pequeño que sea, nos acerca a la meta.',
    'El 100% de lo recaudado se destina directamente a los materiales y la mano de obra. Publicaremos avances y comprobantes de cada gasto para que veas el impacto de tu donación.',
  ],

  // --- Donaciones recientes (muestra social) ---
  recentDonations: [
    { id: 1, name: 'María González', amount: 150, message: '¡Mucho ánimo!', date: '2026-06-25' },
    { id: 2, name: 'Anónimo', amount: 50, message: '', date: '2026-06-24' },
    { id: 3, name: 'Carlos Ruiz', amount: 200, message: 'Por los niños 💚', date: '2026-06-23' },
    { id: 4, name: 'Familia Pérez', amount: 75, message: 'Con cariño', date: '2026-06-22' },
    { id: 5, name: 'Anónimo', amount: 30, message: '', date: '2026-06-21' },
  ],

  // --- Montos sugeridos para el botón de donar ---
  suggestedAmounts: [10, 20, 50, 100],

  // ---------------------------------------------------------------------------
  // MÉTODOS DE PAGO
  // Estos datos se muestran al donante para que haga la transferencia.
  // Cambia los valores por los de tu cuenta real.
  // ---------------------------------------------------------------------------
  paymentMethods: {
    yape: {
      enabled: true,
      holder: 'Asociación Los Pinos',
      phone: '987 654 321',
      // Opcional: ruta a una imagen del QR de Yape (colócala en /public).
      // Si lo dejas vacío, solo se muestra el número.
      qrImage: '',
    },
    bankTransfer: {
      enabled: true,
      bank: 'BCP',
      accountName: 'Asociación Vecinal Los Pinos',
      accountNumber: '193-12345678-0-99',
      cci: '002-193-001234567800-99',
      currency: 'Soles (S/)',
    },
  },
}
