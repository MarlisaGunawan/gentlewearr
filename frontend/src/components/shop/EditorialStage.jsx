import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../../animations/gsap';
import { hotspots } from '../../config/catalog';

const CREAM = [243, 234, 223];
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A soft, pastel version of a colour (mixed with cream) for the stage background.
 * Dark colours get more cream, so black or indigo still give a light, airy stage.
 */
function softTone(hex) {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lightness = (rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11) / 255;
  const amount = lightness < 0.3 ? 0.26 : 0.4;
  const mix = rgb.map((c, i) => Math.round(c * amount + CREAM[i] * (1 - amount)));
  return 'rgb(' + mix.join(' ') + ')';
}

/**
 * Editorial product stage:
 * 1. Tilt — the photo leans in 3D towards the cursor, with a moving glare,
 *    and floats gently. A giant product name scrolls slowly behind it.
 * 2. Flip — changing product turns the photo over like a magazine page.
 * 3. Colour reveal — picking a colour floods the stage with that colour,
 *    growing from the colour swatches' side, and the garment itself fades to
 *    its recoloured photo (made by scripts/recolor_variants.py).
 * 4. Hotspots — pulsing dots on the garment open little cards with details.
 */
export default function EditorialStage({ product, color }) {
  const stageRef = useRef(null);
  const baseRef = useRef(null);
  const revealRef = useRef(null);
  const marqueeRef = useRef(null);
  const floatRef = useRef(null);
  const tiltRef = useRef(null);
  const cardRef = useRef(null);
  const fadeRef = useRef(null);
  const tiltTo = useRef(null);
  // The selected colour, if it belongs to this product (the page updates it a moment later).
  const activeColor = color && product.colors.some((c) => c.name === color.name) ? color : product.colors[0];
  const targetImage = activeColor.image ?? product.image;
  const targetRef = useRef(targetImage);
  targetRef.current = targetImage;

  const [shown, setShown] = useState(product); // product currently on the card
  const [image, setImage] = useState(targetImage); // photo currently on the card
  const [openSpot, setOpenSpot] = useState(null);

  const tone = softTone(activeColor.hex);
  const spots = hotspots[shown.id] ?? [];
  const title = shown.name.split(' — ')[0];

  // Endless effects: floating card + scrolling name.
  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const float = gsap.to(floatRef.current, { y: -12, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    const marquee = gsap.to(marqueeRef.current, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });

    // Fast "follow the cursor" setters for the tilt; perspective gives the flip real depth.
    gsap.set(tiltRef.current, { transformPerspective: 900 });
    gsap.set(cardRef.current, { transformPerspective: 1200 });
    tiltTo.current = {
      x: gsap.quickTo(tiltRef.current, 'rotationX', { duration: 0.7, ease: 'power3.out' }),
      y: gsap.quickTo(tiltRef.current, 'rotationY', { duration: 0.7, ease: 'power3.out' }),
    };

    return () => {
      float.kill();
      marquee.kill();
    };
  }, []);

  // Page-flip when the product changes; the photo swaps while edge-on.
  useEffect(() => {
    if (product.id === shown.id) return undefined;
    setOpenSpot(null);
    if (reduceMotion()) {
      setShown(product);
      setImage(targetRef.current);
      return undefined;
    }
    const flip = gsap
      .timeline()
      .to(cardRef.current, { rotationY: 90, duration: 0.32, ease: 'power2.in' })
      .call(() => {
        setShown(product);
        setImage(targetRef.current);
      })
      .fromTo(cardRef.current, { rotationY: -90 }, { rotationY: 0, duration: 0.65, ease: 'power3.out' });
    return () => flip.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Preload this product's colour photos so switching colour is instant.
  useEffect(() => {
    product.colors.forEach((c) => {
      if (c.image) new Image().src = c.image;
    });
  }, [product]);

  // Same product, new colour → fade the garment to its recoloured photo.
  useEffect(() => {
    if (product.id !== shown.id || targetImage === image) return undefined;
    if (reduceMotion()) {
      setImage(targetImage);
      return undefined;
    }
    const fade = fadeRef.current;
    fade.src = targetImage;
    const tween = gsap.fromTo(
      fade,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.7, ease: 'power2.inOut', onComplete: () => setImage(targetImage) }
    );
    return () => tween.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetImage]);

  // Hotspots pop in one by one for each new photo.
  useLayoutEffect(() => {
    if (reduceMotion()) return;
    gsap.fromTo(
      cardRef.current.querySelectorAll('.spot'),
      { scale: 0, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.1, delay: 0.35 }
    );
  }, [shown]);

  // Colour reveal: a circle of the new colour grows from the right (where the swatches are).
  const firstTone = useRef(true);
  useEffect(() => {
    if (firstTone.current || reduceMotion()) {
      firstTone.current = false;
      baseRef.current.style.background = tone;
      return undefined;
    }
    const reveal = revealRef.current;
    reveal.style.background = tone;
    const tween = gsap.fromTo(
      reveal,
      { clipPath: 'circle(0% at 100% 50%)' },
      {
        clipPath: 'circle(150% at 100% 50%)',
        duration: 0.9,
        ease: 'power2.inOut',
        onComplete: () => {
          baseRef.current.style.background = tone;
          gsap.set(reveal, { clipPath: 'circle(0% at 100% 50%)' });
        },
      }
    );
    return () => tween.kill();
  }, [tone]);

  // ── Tilt towards the pointer (mouse / pen only) ──
  const onPointerMove = (event) => {
    if (event.pointerType === 'touch' || !tiltTo.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / (rect.width / 2) - 1));
    const ny = Math.max(-1, Math.min(1, (event.clientY - rect.top) / (rect.height / 2) - 1));
    tiltTo.current.y(nx * 14);
    tiltTo.current.x(-ny * 10);
    // Glare follows the pointer.
    cardRef.current.style.setProperty('--gx', 50 + nx * 40 + '%');
    cardRef.current.style.setProperty('--gy', 50 + ny * 40 + '%');
  };

  const onPointerLeave = () => {
    tiltTo.current?.x(0);
    tiltTo.current?.y(0);
  };

  return (
    <div ref={stageRef} className="ed" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div ref={baseRef} className="ed__bg" aria-hidden="true" />
      <div ref={revealRef} className="ed__bg ed__bg--reveal" aria-hidden="true" />

      {/* Giant product name drifting behind the photo */}
      <div className="ed__marquee" aria-hidden="true">
        <div ref={marqueeRef} className="ed__marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy}>
              {title} · {title} ·&nbsp;
            </span>
          ))}
        </div>
      </div>

      <div className="ed__shadow" aria-hidden="true" />

      <div ref={floatRef} className="ed__float">
        <div ref={tiltRef} className="ed__tilt">
          <div ref={cardRef} className="ed__card">
            {/* Main photo + a copy on top that fades in the new colour; once the main
                photo has loaded the new colour, the copy is hidden again. */}
            <img
              src={image}
              alt={shown.name}
              draggable={false}
              onLoad={() => gsap.set(fadeRef.current, { autoAlpha: 0 })}
            />
            <img ref={fadeRef} className="ed__fade" alt="" draggable={false} />
            <span className="ed__glare" aria-hidden="true" />

            {spots.map((s, i) => {
              const open = openSpot === i;
              return (
                <div
                  key={shown.id + i}
                  className={'spot' + (open ? ' is-open' : '') + (s.x > 55 ? ' spot--left' : '')}
                  style={{ left: s.x + '%', top: s.y + '%' }}
                >
                  <button
                    type="button"
                    className="spot__dot"
                    aria-expanded={open}
                    aria-label={s.title}
                    onClick={() => setOpenSpot(open ? null : i)}
                  />
                  <span className="spot__card" role="tooltip">
                    <strong>{s.title}</strong>
                    {s.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <span className="ed__code">{shown.code}</span>
    </div>
  );
}
