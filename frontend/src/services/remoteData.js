import { applyCatalog, getProduct } from '../config/catalog';
import { footerContent } from '../config/footerContent';
import { clipKey, clips, controls, heroContent } from '../config/heroContent';
import { editorial, essentials, featuredPanel, lookbook, shopRow } from '../config/landingContent';
import { navContent } from '../config/navContent';
import { api, apiEnabled } from './api';

/** SKUs chosen in the CMS → catalog products (unknown SKUs are skipped). */
const productsFor = (skus) => (skus ?? []).map(getProduct).filter(Boolean);

/** Copy only filled values, so an empty media field keeps the bundled photo/video. */
function assignFilled(target, values) {
  Object.entries(values).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) target[key] = value;
  });
}

/** Browser tab: title, description and favicon. */
function applySite(site) {
  if (site.title) document.title = site.title;
  const setMeta = (selector, attr, value) => {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, selector.match(/"(.+)"/)[1]);
      document.head.appendChild(el);
    }
    el.content = value;
  };
  if (site.description) setMeta('meta[name="description"]', 'name', site.description);
  if (site.title) setMeta('meta[property="og:title"]', 'property', site.title);
  if (site.favicon) {
    const icon = document.head.querySelector('link[rel="icon"]');
    icon.removeAttribute('type');
    icon.href = site.favicon;
  }
  if (site.name) {
    navContent.brand = site.name;
    footerContent.brand = site.name;
  }
  if (site.logo) navContent.logo = site.logo;
}

/** Hero: texts, poster image and the four clip pairs. */
function applyHero({ controls: cmsControls, ...hero }) {
  assignFilled(heroContent, hero);
  (cmsControls ?? []).forEach((c) => {
    const control = controls.find((x) => x.id === c.id);
    if (control) assignFilled(control, { label: c.label, forward: c.forward, reverse: c.reverse });
  });
  // `clips` was built at import time: refresh its sources in place.
  clips.forEach((clip) => {
    const control = controls.find((c) => clipKey(c.id, 'forward') === clip.key || clipKey(c.id, 'reverse') === clip.key);
    clip.src = clip.key.endsWith(':forward') ? control.forward : control.reverse;
  });
}

/** CMS content (GET /api/content) → the config objects the pages read. */
function applyContent(content) {
  if (content.site) applySite(content.site);

  if (content.navbar?.links) {
    // Same array object is shared with the footer menu, so change it in place.
    const links = content.navbar.links.filter((l) => l.visible).map(({ id, label }) => ({ id, label }));
    if (links.length) navContent.links.splice(0, navContent.links.length, ...links);
  }

  if (content.hero) applyHero(content.hero);

  if (content.featured) {
    const { product_skus: skus, ...texts } = content.featured;
    assignFilled(featuredPanel, texts);
    const list = productsFor(skus);
    if (list.length) featuredPanel.products = list;
  }

  if (content.essentials) {
    essentials.title = content.essentials.title ?? essentials.title;
    const list = productsFor(content.essentials.product_skus);
    if (list.length) shopRow.splice(0, shopRow.length, ...list);
  }

  if (content.editorial) assignFilled(editorial, content.editorial);
  if (content.lookbook) assignFilled(lookbook, content.lookbook);

  if (content.footer) {
    const { instagram, tiktok, image, video, ...texts } = content.footer;
    assignFilled(footerContent, texts);
    assignFilled(footerContent.media, { image, video });
    const links = { Instagram: instagram, TikTok: tiktok };
    footerContent.social = footerContent.social.map((s) => (links[s.name] ? { ...s, href: links[s.name] } : s));
  }
}

/**
 * Called once before the app renders. Loads live products, stock and CMS texts
 * from Laravel. If the API is off or unreachable, the bundled demo data is used.
 */
export async function loadRemoteData() {
  if (!apiEnabled) return { source: 'local' };

  const [catalog, content] = await Promise.allSettled([
    api('/products', { timeout: 5000 }),
    api('/content', { timeout: 5000 }),
  ]);

  if (catalog.status === 'fulfilled') applyCatalog(catalog.value);
  if (content.status === 'fulfilled') applyContent(content.value);

  const source = catalog.status === 'fulfilled' ? 'api' : 'local';
  if (source === 'local') console.warn('Gentle Wear: API unreachable, showing demo data.');
  return { source };
}
