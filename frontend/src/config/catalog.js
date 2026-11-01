// Product catalog: categories, products and stock per variant (colour × size).
// This is the single source of product data for the frontend. Later the Laravel
// API (`GET /api/products`) will return the same shape.

const photo = (id, w = 900) =>
  'https://images.unsplash.com/photo-' + id + '?w=' + w + '&q=75&auto=format&fit=crop';

// Recoloured photos for extra colours, made by scripts/recolor_variants.py.
const variant = (name) => '/products/' + name + '.jpg';

export const formatPrice = (value) => 'Rp ' + value.toLocaleString('id-ID');

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const FREE_SHIPPING_MIN = 500000;

// ── Categories ─────────────────────────────────────────────

export const categories = [
  {
    slug: 't-shirts',
    name: 'T-Shirts',
    title: 'The Everyday Tee Edit',
    description: 'Heavy cotton, clean necklines and easy fits. The tees you reach for first, every single day.',
  },
  {
    slug: 'shirts',
    name: 'Shirts',
    title: 'The Office Shirt Edit',
    description: 'Crisp oxfords and poplins cut slim enough for meetings and relaxed enough for after.',
  },
  {
    slug: 'knitwear',
    name: 'Knitwear',
    title: 'Soft Knit & Fleece',
    description: 'Warm, soft and easy layers for cool mornings, long flights and slow weekends.',
  },
  {
    slug: 'jackets',
    name: 'Jackets',
    title: 'Modern Outerwear Set',
    description: 'Leather, satin and tailored layers that finish every outfit — from city nights to weddings.',
  },
  {
    slug: 'trousers',
    name: 'Trousers',
    title: 'Denim & Chino Edit',
    description: 'Straight and relaxed cuts in sturdy denim and soft cotton twill, made to wear in.',
  },
];

// ── Products ───────────────────────────────────────────────

// Fills in sizes and the default "line" text so each product below stays short.
const product = (data) => ({
  sizes: SIZES,
  soldOut: false,
  badge: null,
  line: data.category + ' / latest',
  ...data,
});

export const products = [
  // T-Shirts
  product({ id: 'gw-101', code: 'GW-#101', category: 'T-Shirts', line: 'Gentle Basics / featured', name: 'Everyday crew tee — White, 220 gsm combed cotton', price: 149000, image: photo('1586790170083-2f9ceadc732d'), colors: [{ name: 'White', hex: '#f4f2ee' }, { name: 'Black', hex: '#1f1c19', image: variant('gw-101-black') }, { name: 'Sand', hex: '#d8c3a5', image: variant('gw-101-sand') }], description: 'Our best-selling crew tee in heavy 220 gsm combed cotton. Holds its shape wash after wash.' }),
  product({ id: 'gw-102', code: 'GW-#102', category: 'T-Shirts', line: 'Gentle Basics / latest', name: 'Ringer tee with contrast trim — Black and grey', price: 169000, soldOut: true, badge: 'copy', image: photo('1622519407650-3df9883f76a5'), colors: [{ name: 'Black', hex: '#1f1c19' }], description: 'A retro ringer with grey contrast trim at the neck and sleeves.' }),
  product({ id: 'gw-111', code: 'GW-#111', category: 'T-Shirts', name: 'Graphic tee "Peace" — Washed black', price: 179000, image: photo('1503341504253-dff4815485f1'), colors: [{ name: 'Washed black', hex: '#2b2826' }], description: 'Soft washed cotton with a hand-drawn peace print on the chest.' }),
  product({ id: 'gw-112', code: 'GW-#112', category: 'T-Shirts', line: 'T-Shirts / offers', name: 'Pure cotton boxy tee — Optic white', price: 149000, image: photo('1521572163474-6864f9cf17ab'), colors: [{ name: 'White', hex: '#f4f2ee' }, { name: 'Olive', hex: '#7d9066', image: variant('gw-112-olive') }], description: 'A wider, boxy cut with dropped shoulders for a relaxed look.' }),
  product({ id: 'gw-113', code: 'GW-#113', category: 'T-Shirts', name: 'Heavyweight logo tee — Black', price: 159000, badge: 'featured', image: photo('1618354691373-d851c5c3a990'), colors: [{ name: 'Black', hex: '#1f1c19' }, { name: 'Peach', hex: '#d6a283', image: variant('gw-113-peach') }], description: 'Thick cotton jersey with a small embroidered Gentle Wear badge.' }),

  // Shirts
  product({ id: 'gw-105', code: 'GW-#105', category: 'Shirts', line: 'Office Line / featured', name: 'Slim oxford shirt with mini print — Denim blue', price: 279000, image: photo('1596755094514-f87e34085b2c'), colors: [{ name: 'Denim blue', hex: '#4f6d8f' }, { name: 'White', hex: '#f4f2ee', image: variant('gw-105-white') }], description: 'Oxford cotton with a tiny dot print. Button-down collar, slim fit.' }),
  product({ id: 'gw-121', code: 'GW-#121', category: 'Shirts', line: 'Office Line / latest', name: 'Cotton dress shirts, 3-pack — Mixed', price: 459000, badge: 'featured', image: photo('1602810318383-e386cc2a3ccf'), colors: [{ name: 'Mixed', hex: '#8a7f86' }], description: 'Three easy-iron dress shirts: navy, white and burgundy.' }),
  product({ id: 'gw-122', code: 'GW-#122', category: 'Shirts', line: 'Tailoring / offers', name: 'Waistcoat and shirt set — Charcoal', price: 559000, image: photo('1504593811423-6dd665756598'), colors: [{ name: 'Charcoal', hex: '#3d3f45' }], description: 'A matching waistcoat with a crisp white shirt — instant smart look.' }),
  product({ id: 'gw-123', code: 'GW-#123', category: 'Shirts', name: 'Black poplin shirt — Midnight', price: 299000, image: photo('1617127365659-c47fa864d8bc'), colors: [{ name: 'Black', hex: '#1f1c19' }], description: 'Smooth cotton poplin with a hidden button placket.' }),

  // Knitwear
  product({ id: 'gw-103', code: 'GW-#103', category: 'Knitwear', line: 'Knit Studio / offers', name: 'Soft knit crewneck sweater — Dusty pink', price: 329000, image: photo('1516826957135-700dedea698c'), colors: [{ name: 'Dusty pink', hex: '#e2c2c6' }, { name: 'Cream', hex: '#efe6d8', image: variant('gw-103-cream') }], description: 'A soft cotton-blend knit with ribbed cuffs and hem.' }),
  product({ id: 'gw-131', code: 'GW-#131', category: 'Knitwear', name: 'Shawl-collar cardigan — Charcoal', price: 489000, badge: 'featured', image: photo('1506794778202-cad84cf45f1d'), colors: [{ name: 'Charcoal', hex: '#4a4744' }], description: 'Chunky knit cardigan with a wide shawl collar and wooden buttons.' }),
  product({ id: 'gw-132', code: 'GW-#132', category: 'Knitwear', line: 'Weekend / featured', name: 'Brushed fleece hoodie — Heather grey', price: 359000, image: photo('1556821840-3a63f95609a7'), colors: [{ name: 'Heather grey', hex: '#a9a9a6' }, { name: 'Sage', hex: '#7d9066', image: variant('gw-132-sage') }], description: 'Brushed inside for warmth, with a roomy hood and kangaroo pocket.' }),

  // Jackets
  product({ id: 'gw-104', code: 'GW-#104', category: 'Jackets', line: 'Outerwear / latest', name: 'Biker jacket in vegan leather — Jet black', price: 749000, badge: 'featured', image: photo('1520975954732-35dd22299614'), colors: [{ name: 'Jet black', hex: '#141210' }], description: 'Asymmetric zip biker jacket in soft vegan leather.' }),
  product({ id: 'gw-141', code: 'GW-#141', category: 'Jackets', line: 'Outerwear / offers', name: 'Satin bomber jacket — Rust orange', price: 459000, image: photo('1591047139829-d91aecb6caea'), colors: [{ name: 'Rust', hex: '#b5643c' }, { name: 'Olive', hex: '#6b7350', image: variant('gw-141-olive') }], description: 'Light satin bomber with ribbed collar, cuffs and hem.' }),
  product({ id: 'gw-142', code: 'GW-#142', category: 'Jackets', name: 'Classic leather jacket — Black', price: 899000, image: photo('1551028719-00167b16eac5'), colors: [{ name: 'Black', hex: '#141210' }], description: 'A timeless leather jacket that gets better with every wear.' }),
  product({ id: 'gw-143', code: 'GW-#143', category: 'Jackets', name: 'Everyday zip jacket — Graphite', price: 529000, image: photo('1492562080023-ab3db95bfbce'), colors: [{ name: 'Graphite', hex: '#3a3a3c' }], description: 'Water-resistant shell with a soft lining, for daily commutes.' }),
  product({ id: 'gw-144', code: 'GW-#144', category: 'Jackets', line: 'Tailoring / latest', name: 'Slim suit jacket — Royal navy', price: 949000, soldOut: true, image: photo('1617137968427-85924c800a22'), colors: [{ name: 'Navy', hex: '#24345a' }], description: 'Two-button slim suit jacket in a light wool blend.' }),

  // Trousers
  product({ id: 'gw-106', code: 'GW-#106', category: 'Trousers', line: 'Denim Lab / latest', name: 'Straight-fit raw denim jeans — Indigo', price: 399000, image: photo('1624378439575-d8705ad7ae80'), colors: [{ name: 'Indigo', hex: '#2c3a55' }], description: 'Rigid 13 oz denim that fades to your own shape.' }),
  product({ id: 'gw-151', code: 'GW-#151', category: 'Trousers', line: 'Denim Lab / offers', name: 'Washed denim duo — Light and dark', price: 649000, badge: 'featured', image: photo('1542272604-787c3835535d'), colors: [{ name: 'Light wash', hex: '#8ea3bd' }, { name: 'Dark wash', hex: '#33415c' }], description: 'Two pairs of everyday jeans in light and dark wash.' }),
  product({ id: 'gw-152', code: 'GW-#152', category: 'Trousers', name: 'Relaxed cotton chino — Tan', price: 349000, image: photo('1488161628813-04466f872be2'), colors: [{ name: 'Tan', hex: '#b58a5a' }, { name: 'Stone', hex: '#cfc6b6', image: variant('gw-152-stone') }], description: 'Soft cotton twill chinos with a relaxed, tapered leg.' }),
];

// ── Detail hotspots ────────────────────────────────────────
// Points on each photo (x / y in % of the 3:4 photo) with a short fact.
// Shown as pulsing dots on the product detail stage.

const spot = (x, y, title, text) => ({ x, y, title, text });

export const hotspots = {
  'gw-101': [spot(50, 44, 'Ribbed crew neck', 'Keeps its shape wash after wash'), spot(38, 60, '220 gsm cotton', 'Heavy, combed and soft'), spot(80, 50, 'Taped shoulders', 'No stretching at the seams')],
  'gw-102': [spot(52, 31, 'Contrast trim', 'Retro ringer neck and cuffs'), spot(50, 56, 'Soft jersey', '180 gsm, light and breathable')],
  'gw-111': [spot(53, 43, 'Hand-drawn print', 'Water-based ink, soft to touch'), spot(50, 27, 'Washed cotton', 'Lived-in feel from day one')],
  'gw-112': [spot(50, 12, 'Clean neckline', 'Narrow rib, sits flat'), spot(27, 30, 'Dropped shoulders', 'Relaxed, boxy silhouette'), spot(50, 58, 'Pure cotton', '100% cotton jersey')],
  'gw-113': [spot(78, 45, 'Embroidered badge', 'Small Gentle Wear crest'), spot(36, 62, 'Heavyweight jersey', '240 gsm, holds its shape')],
  'gw-105': [spot(50, 30, 'Button-down collar', 'Stays neat without a tie'), spot(38, 62, 'Mini dot oxford', 'Woven cotton with a tiny print')],
  'gw-121': [spot(56, 46, 'Easy-iron cotton', 'Smooth out of the wash'), spot(76, 72, 'Three colours', 'Navy, white and burgundy')],
  'gw-122': [spot(45, 66, 'Matching waistcoat', 'Five-button, fitted back'), spot(62, 48, 'Crisp poplin shirt', 'Included in the set')],
  'gw-123': [spot(52, 52, 'Hidden placket', 'Buttons tucked out of sight'), spot(36, 70, 'Smooth poplin', 'Pairs with tailoring')],
  'gw-103': [spot(36, 27, 'Cotton-blend knit', 'Soft, never itchy'), spot(40, 40, 'Ribbed hem & cuffs', 'Keeps the shape in place')],
  'gw-131': [spot(50, 86, 'Shawl collar', 'Wide, cosy and structured'), spot(28, 80, 'Chunky knit', 'Warm wool-blend yarn')],
  'gw-132': [spot(50, 22, 'Roomy hood', 'Lined, with no drawcord to snag'), spot(50, 56, 'Brushed fleece', 'Soft inside, warm all day')],
  'gw-104': [spot(45, 42, 'Asymmetric zip', 'Classic biker front'), spot(68, 50, 'Vegan leather', 'Soft and animal-free')],
  'gw-141': [spot(50, 24, 'Ribbed collar', 'Classic bomber finish'), spot(40, 52, 'Light satin', 'Smooth with a subtle sheen'), spot(50, 80, 'Ribbed hem', 'Stays put at the waist')],
  'gw-142': [spot(40, 46, 'Real leather', 'Softens as you wear it'), spot(60, 38, 'Metal zips', 'Heavy-duty and smooth')],
  'gw-143': [spot(30, 82, 'Water-resistant', 'Shrugs off light rain'), spot(62, 78, 'Soft lining', 'Comfortable over a tee')],
  'gw-144': [spot(45, 42, 'Two-button front', 'Slim, modern cut'), spot(45, 72, 'Wool blend', 'Light and breathable')],
  'gw-106': [spot(50, 8, 'Rigid 13 oz denim', 'Fades to your shape'), spot(35, 56, 'Straight leg', 'Classic, easy fit')],
  'gw-151': [spot(62, 22, 'Two washes', 'Light and dark in one pack'), spot(40, 66, 'Everyday denim', 'Comfort stretch')],
  'gw-152': [spot(46, 72, 'Cotton twill', 'Soft and breathable'), spot(57, 81, 'Tapered leg', 'Relaxed through the thigh')],
};

// ── Helpers ────────────────────────────────────────────────

export const getCategory = (slug) => categories.find((c) => c.slug === slug);

export const categorySlug = (name) => categories.find((c) => c.name === name)?.slug;

export const getProduct = (id) => products.find((p) => p.id === id);

/**
 * Name for a colour: "Everyday crew tee — White, 220 gsm…" becomes "… — Sand, 220 gsm…"
 * (the colour part after the dash is swapped when another colour is picked).
 */
export function nameFor(p, colorName) {
  const [base, rest] = p.name.split(' — ');
  if (!rest || !colorName || colorName === p.colors[0].name) return p.name;
  const [first, ...more] = rest.split(', ');
  if (!first.toLowerCase().includes(p.colors[0].name.toLowerCase())) return p.name;
  return base + ' — ' + [colorName, ...more].join(', ');
}

/** Photo for a colour: its own recoloured photo if there is one, otherwise the main photo. */
export const imageFor = (p, colorName) => p.colors.find((c) => c.name === colorName)?.image ?? p.image;

export const productsInCategory = (name) => products.filter((p) => p.category === name);

export const productUrl = (p) => '/shop/' + categorySlug(p.category) + '?product=' + p.id;

/**
 * Stock for one variant. With the Laravel API this is the real inventory
 * (`p.stock`, filled by applyCatalog). Without it, each variant gets a fixed demo
 * number derived from its id, so it stays the same on every reload.
 */
export function stockFor(p, color, size) {
  if (p.soldOut) return 0;
  if (p.stock) return p.stock[color + '|' + size] ?? 0;
  const key = p.id + color + size;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  const stock = hash % 13; // 0–12
  return stock < 2 ? 0 : stock; // some variants are sold out, like a real shop
}

// ── Data from the Laravel API ──────────────────────────────

/** API product → the shape used across the shop. */
function fromApi(p) {
  const stock = {};
  p.colors.forEach((c) => c.variants.forEach((v) => (stock[c.name + '|' + v.size] = v.stock)));

  return {
    id: p.sku,
    code: p.code,
    category: p.category,
    line: p.line,
    name: p.name,
    price: p.price,
    badge: p.badge,
    image: p.image,
    description: p.description,
    soldOut: p.sold_out,
    sizes: SIZES.filter((s) => p.colors.some((c) => c.variants.some((v) => v.size === s))),
    colors: p.colors.map((c) => ({ name: c.name, hex: c.hex, ...(c.image ? { image: c.image } : {}) })),
    stock,
  };
}

/**
 * Replace the bundled demo catalog with the one from GET /api/products.
 * Existing product objects are updated in place, so every list that already
 * points at them (featured panel, shop row…) shows the live prices and stock.
 */
export function applyCatalog(data) {
  categories.splice(0, categories.length, ...data.categories);

  const fresh = data.products.map(fromApi);
  const next = fresh.map((p) => {
    const existing = getProduct(p.id);
    return existing ? Object.assign(existing, p) : p;
  });
  products.splice(0, products.length, ...next);

  data.products.forEach((p) => {
    hotspots[p.sku] = p.hotspots;
  });
}
