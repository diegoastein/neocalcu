// Lleva un elemento al tope del área visible del contenedor de scroll principal (<main>),
// descontando los encabezados sticky (marcados con data-sticky) para que no lo tapen.
export function scrollToElement(el: HTMLElement | null, behavior: ScrollBehavior = 'smooth') {
  if (!el) return;
  const container = el.closest('main');
  if (!container) {
    el.scrollIntoView({ behavior, block: 'start' });
    return;
  }

  let stickyOffset = 0;
  container.querySelectorAll<HTMLElement>('[data-sticky]').forEach((s) => {
    // Solo cuentan los sticky que están antes del elemento (los que quedarían fijados encima)
    const precedes = s.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;
    if (precedes && !s.contains(el)) stickyOffset += s.offsetHeight;
  });

  const top =
    el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - stickyOffset;
  if (Math.abs(container.scrollTop - top) < 2) return;
  container.scrollTo({ top: Math.max(0, top), behavior });
}

// Espera a que React pinte el contenido expandido antes de medir y scrollear.
export function scrollToElementAfterRender(getEl: () => HTMLElement | null, behavior: ScrollBehavior = 'smooth') {
  requestAnimationFrame(() => requestAnimationFrame(() => scrollToElement(getEl(), behavior)));
}
