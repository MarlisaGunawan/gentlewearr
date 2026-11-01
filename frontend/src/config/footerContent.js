// Footer text, links and background. Later this can come from the Laravel CMS.
import { navContent } from './navContent';
import { categories } from './catalog';

export const footerContent = {
  brand: 'Gentle Wear',
  title: 'Everyday menswear, made gently',
  text:
    'Gentle Wear makes honest basics — tees, shirts, chinos, knitwear and jackets — cut to fit the way you live, from the office to the weekend.',
  cta: { label: 'Shop the collection', target: 'collection' },
  copyright: '© 2026 Gentle Wear. Made by Marlisa.',

  // Same sections as the navbar — clicking scrolls to them.
  menu: navContent.links,

  // Every shop category — clicking opens its detail page.
  categories,

  essentials: ['Help centre', 'Shipping & returns', 'Size guide', 'Privacy notice', 'Terms of service'],

  social: [
    { name: 'Instagram', href: 'https://www.instagram.com/' },
    { name: 'TikTok', href: 'https://www.tiktok.com/' },
  ],

  // Golden-hour meadow (Unsplash). To use a looping video instead,
  // add `video: 'https://…/clip.mp4'` — the image becomes its poster.
  media: {
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=2000&q=80&auto=format&fit=crop',
    video: null,
  },
};
