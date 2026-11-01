const NAV_OFFSET = 72; // height of the fixed navbar

/** Distance from the top of the page, ignoring CSS transforms (GSAP reveals move elements). */
function pageTop(element) {
  let top = 0;
  for (let el = element; el; el = el.offsetParent) top += el.offsetTop;
  return top;
}

/**
 * Scroll to the section with this id, landing just below the navbar.
 * Smooth by default; instant when `instant` is set or the user prefers less motion.
 */
export function scrollToSection(id, { instant = false } = {}) {
  const section = document.getElementById(id);
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: Math.max(0, pageTop(section) - (id === 'home' ? 0 : NAV_OFFSET)),
    behavior: instant || reduceMotion ? 'auto' : 'smooth',
  });
  history.replaceState(history.state, '', '#' + id);
}
