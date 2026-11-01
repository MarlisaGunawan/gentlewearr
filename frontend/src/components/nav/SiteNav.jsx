import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { navContent } from '../../config/navContent';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useHideOnScroll } from '../../hooks/useHideOnScroll';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useSectionNav } from '../../hooks/useSectionNav';
import PillNav from '../reactbits/PillNav/PillNav';
import CartButton from './CartButton';

// PillNav's colours are CSS variables, so we can make its glass clearer than the
// defaults. Over the hero: white-tinted glass; after the hero: brighter frosted glass.
const clearGlass = {
  dark: {
    '--pn-surface': 'rgba(255, 255, 255, 0.12)',
    '--pn-edge': 'rgba(255, 255, 255, 0.22)',
    '--pn-rim': 'rgba(255, 255, 255, 0.28)',
    '--pn-shadow': '0 10px 30px -14px rgba(0, 0, 0, 0.35)',
    '--pn-tile': 'rgba(255, 255, 255, 0.08)',
    '--pn-tile-rim': 'inset 0 0 0 1px rgba(255, 255, 255, 0.14)',
    '--pn-text': 'rgba(255, 255, 255, 0.85)',
    '--pn-strong': '#ffffff',
  },
  light: {
    '--pn-surface': 'rgba(255, 255, 255, 0.38)',
    '--pn-edge': 'rgba(31, 28, 25, 0.08)',
    '--pn-rim': 'rgba(255, 255, 255, 0.8)',
    '--pn-shadow': '0 10px 30px -16px rgba(31, 28, 25, 0.3)',
    '--pn-tile': 'rgba(255, 255, 255, 0.5)',
    '--pn-tile-rim': 'inset 0 0 0 1px rgba(255, 255, 255, 0.7)',
    '--pn-strong': '#1f1c19',
  },
};

/**
 * Fixed, see-through navbar: logo · React Bits PillNav · cart.
 * - Dark-text theme once the hero has scrolled away.
 * - Hides while scrolling down, comes back when scrolling up.
 * - Links smooth-scroll to sections; the active section gets the dot.
 */
export default function SiteNav() {
  const { pathname } = useLocation();
  const onHome = pathname === '/';
  // Built here (not at import time) so labels/order edited in the CMS are used.
  const sectionIds = useMemo(() => navContent.links.map((link) => link.id), []);
  const pillItems = useMemo(() => navContent.links.map((link) => ({ label: link.label, href: '#' + link.id })), []);
  const activeId = useActiveSection(sectionIds, pathname);
  const goToSection = useSectionNav();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [hidden, pauseHiding] = useHideOnScroll();
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = pastHero ? 'light' : 'dark';

  // Switch to the light theme once the hero is (almost) out of view.
  // Pages without the hero (shop, checkout…) always use the light theme.
  useEffect(() => {
    const hero = document.getElementById('home');
    if (!hero) {
      setPastHero(true);
      return undefined;
    }
    setPastHero(false);
    const observer = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), {
      rootMargin: '-80px 0px 0px 0px',
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  const goTo = (event, id) => {
    event.preventDefault();
    pauseHiding(1200); // keep the bar visible during the smooth scroll
    goToSection(id);
  };

  const className = ['site-nav', 'site-nav--' + theme, hidden && !menuOpen && 'is-hidden']
    .filter(Boolean)
    .join(' ');

  return (
    <header className={className}>
      <a className="nav-glass site-nav__logo" href="#home" aria-label={navContent.brand + ' home'} onClick={(e) => goTo(e, 'home')}>
        <img src={navContent.logo || logo} alt="" />
      </a>

      {/* '#none' matches no item, so no dot shows on the shop/checkout pages */}
      <div className="site-nav__center">
        <PillNav
          items={pillItems}
          activeHref={onHome ? '#' + activeId : '#none'}
          onItemClick={(item, _index, event) => goTo(event, item.href.slice(1))}
          itemStyle="pill"
          hoverEffect="fill"
          indicator="dot"
          theme={theme}
          style={clearGlass[theme]}
          collapse={isMobile ? 'always' : 'never'}
          onMenuToggle={setMenuOpen}
          ariaLabel="Sections"
        />
      </div>

      <CartButton />
    </header>
  );
}
