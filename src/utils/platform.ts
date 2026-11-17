// Detecta si la app corre dentro de un TWA (Trusted Web Activity) lanzada desde Play Store.
// Android inyecta el package ID en document.referrer al abrir un TWA.
export const isPlayStoreTWA: boolean =
  typeof document !== 'undefined' &&
  document.referrer.startsWith('android-app://');

// Modo libre: todas las funciones premium abiertas y sin ninguna UI de pago/suscripción.
// Poner en false para volver al modelo freemium (el código de suscripción sigue intacto).
export const FREE_MODE = true;

// true cuando no hay que mostrar nada de monetización (modo libre o TWA de Play Store)
export const hideMonetization: boolean = FREE_MODE || isPlayStoreTWA;
