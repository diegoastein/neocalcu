declare function gtag(...args: unknown[]): void;

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof gtag !== 'function') return;
  gtag('event', name, params ?? {});
}
