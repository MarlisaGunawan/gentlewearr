import { useEffect, useState } from 'react';

/**
 * Returns the id of the section currently in the middle of the screen,
 * so the navbar can highlight its link.
 * Pass the current path as `pageKey` so it re-scans after changing page.
 */
export function useActiveSection(ids, pageKey) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      // Only a thin band around the middle of the viewport counts as "active".
      { rootMargin: '-45% 0px -50% 0px' }
    );

    ids.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [ids, pageKey]); // pageKey: re-scan when the page (and its sections) changes

  return activeId;
}
