/** Focus an element and scroll it to the top, respecting reduced motion. */
export function focusAndReveal(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
}

/** Focus the first invalid control inside a form on the next frame. */
export function focusFirstInvalid(form) {
  requestAnimationFrame(() => form?.querySelector('[aria-invalid="true"]')?.focus());
}
