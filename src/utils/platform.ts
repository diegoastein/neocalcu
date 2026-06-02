// Detecta si la app corre dentro de un TWA (Trusted Web Activity) lanzada desde Play Store.
// Android inyecta el package ID en document.referrer al abrir un TWA.
export const isPlayStoreTWA: boolean =
  typeof document !== 'undefined' &&
  document.referrer.startsWith('android-app://');
