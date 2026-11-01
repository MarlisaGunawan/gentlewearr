import { gsap, MOTION_OK, ScrollTrigger } from './gsap';

/*
 * Page-wide scroll animations, switched on with data attributes in the markup:
 *
 *   data-reveal              → fades and slides up once when it enters the screen
 *   data-reveal-stagger      → same, but its children one after another
 *   data-reveal-words        → heading words slide up one by one (use <SplitWords>)
 *   data-reveal-scale        → a whole card rises and grows slightly into place
 *   data-parallax="8"        → moves up/down by ±8% while scrolling past
 *   data-parallax-scope      → (on a parent) the area that drives the parallax
 *
 * Returns a cleanup function that removes every animation.
 */
export function setupScrollAnimations(root) {
  const mm = gsap.matchMedia();
  const all = (selector) => Array.from(root.querySelectorAll(selector));

  mm.add(MOTION_OK, () => {
    // Hero: copy and controller drift up and fade out as you scroll away (parallax).
    const hero = root.querySelector('#home');
    if (hero) {
      gsap
        .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to('.hero', { y: -160, autoAlpha: 0, ease: 'none' }, 0)
        // The controller is centred with translateX(-50%) — keep that while moving it.
        .fromTo('.controller', { x: 0, xPercent: -50 }, { xPercent: -50, y: -160, autoAlpha: 0, ease: 'none' }, 0);
    }

    all('[data-reveal-scale]').forEach((el) => {
      gsap.from(el, {
        y: 70,
        scale: 0.96,
        autoAlpha: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    all('[data-reveal-words]').forEach((el) => {
      gsap.from(el.querySelectorAll('.word__inner'), {
        yPercent: 110,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    all('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 40,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    all('[data-reveal-stagger]').forEach((group) => {
      gsap.from(group.children, {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 88%', once: true },
      });
    });

    all('[data-parallax]').forEach((el) => {
      const amount = parseFloat(el.dataset.parallax) || 8;
      gsap.fromTo(
        el,
        { yPercent: -amount },
        {
          yPercent: amount,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('[data-parallax-scope]') || el.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });

    // Footer: the big wordmark rises out of the fog as the footer arrives.
    const wordmark = root.querySelector('.footer__wordmark');
    if (wordmark) {
      gsap.fromTo(
        wordmark,
        { x: 0, xPercent: -50, yPercent: 45 },
        {
          xPercent: -50,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 15%', scrub: true },
        }
      );
    }
  });

  // Content above can change height (filters, accordions, images), which would
  // leave scroll positions out of date — recalculate when the page height changes.
  let timer;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  resizeObserver.observe(document.body);

  return () => {
    clearTimeout(timer);
    resizeObserver.disconnect();
    mm.revert();
  };
}
