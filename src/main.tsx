import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Pedir almacenamiento persistente: evita que Chrome/Android purgue localStorage
// (device_id, membresía) bajo presión de espacio en sitios de "engagement" bajo.
// No garantiza nada por sí solo — es la primera capa; ver useDonationReminder.ts
// para la recuperación silenciosa por email como red de seguridad.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {
    // Sin soporte o denegado — no es crítico, seguimos con la red de seguridad.
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
