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
  title: 'Ayúdanos a reconstruir la escuela del barrio',
  organizer: 'Asociación Vecinal Los Pinos',
  location: 'Ciudad de México, MX',
  createdAt: '2026-06-01',

  // --- Imagen de portada ---
  coverImage:
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',

  // --- Meta y recaudación ---
  goal: 250000, // Meta total a recaudar
  raised: 162500, // Monto recaudado hasta ahora
  currency: 'MXN',
  donorsCount: 348,

  // --- Descripción (acepta varios párrafos) ---
  story: [
    'Hace tres meses, una tormenta dañó gravemente el techo y las aulas de la escuela primaria de nuestra comunidad. Más de 200 niños se quedaron sin un espacio seguro para estudiar.',
    'Con tu ayuda queremos reconstruir las aulas, reemplazar el mobiliario y volver a abrir las puertas antes del próximo ciclo escolar. Cada aporte, por pequeño que sea, nos acerca a la meta.',
    'El 100% de lo recaudado se destina directamente a los materiales y la mano de obra. Publicaremos avances y comprobantes de cada gasto para que veas el impacto de tu donación.',
  ],

  // --- Donaciones recientes (muestra social) ---
  recentDonations: [
    { id: 1, name: 'María González', amount: 1500, message: '¡Mucho ánimo!', date: '2026-06-25' },
    { id: 2, name: 'Anónimo', amount: 500, message: '', date: '2026-06-24' },
    { id: 3, name: 'Carlos Ruiz', amount: 2000, message: 'Por los niños 💚', date: '2026-06-23' },
    { id: 4, name: 'Familia Pérez', amount: 750, message: 'Con cariño', date: '2026-06-22' },
    { id: 5, name: 'Anónimo', amount: 300, message: '', date: '2026-06-21' },
  ],

  // --- Montos sugeridos para el botón de donar ---
  suggestedAmounts: [200, 500, 1000, 2500],
}
