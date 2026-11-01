import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/hero/Hero';
import Landing from '../components/landing/Landing';
import { scrollToSection } from '../lib/scrollToSection';

/** "/" — the landing page. Also scrolls to a section when sent here from another page. */
export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    const id = location.state?.scrollTo || location.hash.slice(1);
    if (!id) return undefined;
    // Wait until GSAP has laid the page out (pins, parallax), then jump straight
    // there — a smooth scroll would be cut short by that layout work.
    const timer = setTimeout(() => scrollToSection(id, { instant: true }), 300);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      <Hero />
      <Landing />
    </>
  );
}
