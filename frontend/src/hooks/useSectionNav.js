import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scrollToSection } from '../lib/scrollToSection';

/**
 * Returns goTo(id): scrolls to a home-page section. From another page
 * (shop, checkout…) it first goes back to the home page, which then scrolls.
 */
export function useSectionNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return useCallback(
    (id) => {
      if (pathname === '/') scrollToSection(id);
      else navigate('/', { state: { scrollTo: id } });
    },
    [pathname, navigate]
  );
}
