declare function gtag(...args: unknown[]): void;

const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (isDebugMode) return;
  if (typeof gtag !== 'function') return;
  gtag('event', name, params ?? {});
}
