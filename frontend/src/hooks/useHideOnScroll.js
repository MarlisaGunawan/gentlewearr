import { useEffect, useRef, useState } from 'react';

/**
 * Returns [hidden, pause]:
 * - hidden is true while the user scrolls DOWN (past `offset` px), false when they scroll UP.
 * - pause(ms) ignores scrolling for a moment, e.g. during a smooth scroll started by a nav click.
 */
export function useHideOnScroll({ offset = 120, threshold = 6 } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const pausedUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    lastY.current = window.scrollY;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < threshold) return; // ignore tiny jitters

      if (Date.now() > pausedUntil.current) {
        if (y < offset) setHidden(false); // always visible near the top
        else setHidden(delta > 0); // down = hide, up = show
      }
      lastY.current = y;
    };

    // Check at most once per frame.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [offset, threshold]);

  const pause = (ms) => {
    pausedUntil.current = Date.now() + ms;
    setHidden(false);
  };

  return [hidden, pause];
}
