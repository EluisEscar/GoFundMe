# RecaudaYa — Plantilla de recaudación (estilo GoFundMe)

Plantilla de página de crowdfunding hecha con **React + Vite**, responsive y sin
comisiones de plataforma. Muestra la meta, el monto recaudado y una **barra de
progreso** que se llena según el porcentaje alcanzado.

## Características

- 📊 Barra de progreso animada (porcentaje recaudado vs. meta)
- 📱 Diseño responsive (mobile-first, dos columnas en escritorio)
- 💚 Modal para donar con montos sugeridos y monto personalizado
- 👥 Lista de donaciones recientes (prueba social)
- 🗂️ Todos los datos centralizados en un solo archivo, listos para conectar tu backend

## Cómo empezar

> Este proyecto usa **pnpm** como gestor de paquetes.

```bash
pnpm install
pnpm dev      # servidor de desarrollo (http://localhost:5173)
pnpm build    # build de producción en /dist
pnpm preview  # previsualizar el build
```

## Estructura

```
src/
├── App.jsx                  # Componente raíz y estado de la campaña
├── data/campaign.js         # 👈 EDITA AQUÍ los datos de tu campaña
├── utils/format.js          # Formato de moneda, porcentaje y fechas
├── components/
│   ├── ProgressBar.jsx      # Barra de progreso
│   ├── DonationStats.jsx    # Tarjeta lateral con meta y botones
│   ├── DonationList.jsx     # Donaciones recientes
│   └── DonateModal.jsx      # Modal para donar
└── styles/index.css         # Estilos globales (colores en variables CSS)
```

## Conectar tu lógica

> Nota: el repo incluye `pnpm-lock.yaml`. Evita usar `npm install` para no
> generar un `package-lock.json` paralelo.

- **Datos de la campaña:** edita `src/data/campaign.js` o cárgalos desde tu API
  con un `useEffect` en `App.jsx`.
- **Procesar pagos:** la función `handleSubmit` en `DonateModal.jsx` tiene un
  `TODO` donde va la integración con tu pasarela (Stripe, Mercado Pago, etc.).
- **Registrar la donación:** `handleConfirmDonation` en `App.jsx` actualiza el
  estado local; reemplázalo por la respuesta real de tu backend.
- **Colores y marca:** ajusta las variables CSS en `:root` dentro de
  `src/styles/index.css`.
