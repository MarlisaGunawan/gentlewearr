import { useLayoutEffect, useRef } from 'react';
import { gsap, MOTION_OK } from '../../animations/gsap';
import { formatPrice } from '../../config/landingContent';
import SplitWords from '../common/SplitWords';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Lookbook: on desktop the section pins in place and the outfit cards slide
 * sideways as you scroll down (each photo also drifts inside its card, and the
 * blurred backdrop drifts slower = parallax). On phones, or with reduced
 * motion, the cards are a normal swipeable row.
 */
export default function Lookbook({ id, content }) {
  const sectionRef = useRef(null);
  const backdropRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const counterRef = useRef(null);
  const barRef = useRef(null);
  const total = content.looks.length;

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 901px) and ' + MOTION_OK, () => {
      const track = trackRef.current;
      const distance = () => track.scrollWidth - viewportRef.current.clientWidth;

      // 1. Scrolling down moves the row of cards to the left while the section is pinned.
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none', // must be linear so the per-card parallax below stays in sync
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 88px', // just below the navbar
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Counter, progress bar and backdrop update directly — no React re-render per frame.
            counterRef.current.textContent = pad(Math.round(self.progress * (total - 1)) + 1);
            barRef.current.style.transform = 'scaleX(' + self.progress + ')';
            gsap.set(backdropRef.current, { xPercent: -5 + 10 * self.progress });
          },
        },
      });

      // 2. Each photo drifts inside its card as the card crosses the screen.
      track.querySelectorAll('.look').forEach((look) => {
        gsap.fromTo(
          look.querySelector('img'),
          { xPercent: -8 },
          {
            xPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: look,
              containerAnimation: slide,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          }
        );
      });
    });

    return () => mm.revert();
  }, [total]);

  return (
    <section id={id} ref={sectionRef} className="lookbook">
      <div className="lookbook__backdrop" aria-hidden="true">
        <img
          ref={backdropRef}
          src={content.background}
          alt=""
          loading="lazy"
          style={{ objectPosition: content.backgroundPosition }}
        />
      </div>

      <div className="lookbook__intro">
        <p className="lookbook__eyebrow" data-reveal>
          {content.eyebrow}
        </p>
        <h2 data-reveal-words>
          <SplitWords text={content.title} />
        </h2>
        <p className="lookbook__text" data-reveal>
          {content.intro}
        </p>

        <div className="lookbook__progress" aria-hidden="true">
          <span>
            <span ref={counterRef}>01</span> / {pad(total)}
          </span>
          <span className="lookbook__bar">
            <span ref={barRef} />
          </span>
        </div>

        <a className="pill pill--light" href="#">
          {content.action}
        </a>
      </div>

      <div className="lookbook__viewport" ref={viewportRef}>
        <ol className="lookbook__track" ref={trackRef} data-reveal-stagger>
          {content.looks.map((look, i) => (
            <li key={look.id} className="look">
              <img src={look.image} alt={look.name} loading="lazy" />
              <span className="look__number">Look {pad(i + 1)}</span>
              <div className="look__info">
                <h3>{look.name}</h3>
                <p>
                  {look.pieces} pieces · {formatPrice(look.price)}
                </p>
                <a href="#">Shop the look →</a>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
