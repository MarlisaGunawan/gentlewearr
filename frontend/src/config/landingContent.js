// All text, products and photos for the sections below the hero.
// Later this comes from the Laravel CMS (e.g. `GET /api/landing`), same shape.
import { getProduct } from './catalog';

export { formatPrice } from './catalog';

// Photos are from Unsplash (free to use). `w` = width to download.
const photo = (id, w = 800) =>
  'https://images.unsplash.com/photo-' + id + '?w=' + w + '&q=75&auto=format&fit=crop';

const pick = (ids) => ids.map(getProduct);

export const avatar = photo('1507003211169-0a1dd7228f2d', 96);

export const navLinks = [
  { label: 'Home', icon: 'grid', href: '#' },
  { label: 'Store', icon: 'bag', href: '#' },
  { label: 'Products', icon: 'tag', href: '#' },
  { label: 'Lookbook', icon: 'spark', href: '#' },
  { label: 'Service', icon: 'dots', href: '#' },
];

// ── Products ────────────────────────────────────────────────
// soldOut: show the "Sold out" note next to the price.
// featured: 'featured' | 'new' | null → small badge on the photo.

// Featured products are real catalog items, so clicking one opens its detail page.
const featuredClothing = pick(['gw-101', 'gw-102', 'gw-103', 'gw-104', 'gw-105', 'gw-106']);

const footwear = [
  {
    id: 'gw-201',
    code: 'GW-#201',
    line: 'Footwear / featured',
    name: 'Suede court sneaker — Tan brown',
    price: 589000,
    soldOut: false,
    badge: null,
    image: photo('1549298916-b41d501d3772'),
  },
  {
    id: 'gw-202',
    code: 'GW-#202',
    line: 'Footwear / latest',
    name: 'Leather high-top — Off white',
    price: 649000,
    soldOut: true,
    badge: null,
    image: photo('1512374382149-233c42b6a83b'),
  },
  {
    id: 'gw-203',
    code: 'GW-#203',
    line: 'Footwear / offers',
    name: 'Runner mesh sneaker — White and coral',
    price: 529000,
    soldOut: false,
    badge: 'featured',
    image: photo('1600185365483-26d7a4cc7519'),
  },
  {
    id: 'gw-204',
    code: 'GW-#204',
    line: 'Footwear / latest',
    name: 'Knit runner — Cloud grey',
    price: 499000,
    soldOut: false,
    badge: null,
    image: photo('1460353581641-37baddab0fa2'),
  },
];

const classics = [
  {
    id: 'gw-301',
    code: 'GW-#301',
    line: 'Tailoring / featured',
    name: 'Two-button blazer — Midnight black',
    price: 899000,
    soldOut: false,
    badge: null,
    image: photo('1617127365659-c47fa864d8bc'),
  },
  {
    id: 'gw-302',
    code: 'GW-#302',
    line: 'Tailoring / latest',
    name: 'Slim suit jacket — Royal navy',
    price: 949000,
    soldOut: true,
    badge: null,
    image: photo('1617137968427-85924c800a22'),
  },
  {
    id: 'gw-303',
    code: 'GW-#303',
    line: 'Tailoring / offers',
    name: 'Waistcoat and shirt set — Charcoal',
    price: 559000,
    soldOut: false,
    badge: null,
    image: photo('1504593811423-6dd665756598'),
  },
  {
    id: 'gw-304',
    code: 'GW-#304',
    line: 'Office Line / latest',
    name: 'Cotton dress shirts, 3-pack — Mixed',
    price: 459000,
    soldOut: false,
    badge: 'featured',
    image: photo('1602810318383-e386cc2a3ccf'),
  },
];

// ── Sections ────────────────────────────────────────────────

export const featuredPanel = {
  tone: 'peach',
  title: 'Step into everyday menswear, where every piece fits your day',
  intro:
    'Honest fabrics, clean cuts and fair prices. Discover a wardrobe that moves with you, from the office to the weekend.',
  background: photo('1506794778202-cad84cf45f1d', 1600),
  backgroundPosition: 'center 30%',
  primaryAction: 'Go to lookbook',
  secondaryAction: 'Request new products',
  categories: ['All', 'T-Shirts', 'Shirts', 'Knitwear', 'Jackets', 'Trousers'],
  listTitle: 'Featured clothing',
  products: featuredClothing,
  groups: [
    { title: 'Shoes and sneakers', products: footwear },
    { title: 'Shop classics', products: classics },
  ],
};

export const shopRow = pick(['gw-105', 'gw-141', 'gw-113', 'gw-106']);
export const essentials = { title: 'Shop the essentials' };

export const editorial = {
  tag: 'collab',
  overlay: 'Crafted by\nGentle Wear',
  image: photo('1488161628813-04466f872be2', 1200),
  title: 'Gentle Wear x Urban Run Club Unveils the Art of Easy Movement!',
  text:
    'Where every step feels effortless. Our collaboration with Urban Run Club turns your daily commute into a stride of comfort, from the pavement to the coffee shop, built to keep up with you.',
  action: 'Start shopping now',
  thumbs: [photo('1549298916-b41d501d3772', 600), photo('1600185365483-26d7a4cc7519', 600)],
};

export const lookbook = {
  background: photo('1539571696357-5a69c17a67c6', 1600),
  backgroundPosition: 'center 58%',
  eyebrow: 'Lookbook · Season 01',
  title: 'Five ways to wear Gentle Wear this season',
  intro:
    'Complete outfits styled by our team. Scroll through the looks, then shop every piece in one tap.',
  action: 'View full lookbook',
  looks: [
    { id: 'look-1', name: 'Sharp Monday', pieces: 4, price: 1649000, image: photo('1617127365659-c47fa864d8bc', 900) },
    { id: 'look-2', name: 'The Office Edit', pieces: 3, price: 1129000, image: photo('1504593811423-6dd665756598', 900) },
    { id: 'look-3', name: 'Soft Weekend', pieces: 3, price: 868000, image: photo('1516826957135-700dedea698c', 900) },
    { id: 'look-4', name: 'Night Out', pieces: 4, price: 1347000, image: photo('1520975954732-35dd22299614', 900) },
    { id: 'look-5', name: 'Wedding Guest', pieces: 5, price: 1899000, image: photo('1617137968427-85924c800a22', 900) },
  ],
};
