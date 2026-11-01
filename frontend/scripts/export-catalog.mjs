// Exports the frontend catalog (categories, products, colours, stock per variant,
// hotspots) to JSON, so the Laravel seeder fills the database with the same data.
//
// Run from the frontend folder:   node scripts/export-catalog.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, hotspots, products, stockFor } from '../src/config/catalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'backend', 'database', 'seeders', 'data', 'catalog.json');

const data = {
  categories,
  products: products.map((p, index) => ({
    sku: p.id,
    code: p.code,
    category: p.category,
    name: p.name,
    line: p.line,
    description: p.description,
    price: p.price,
    badge: p.badge,
    image: p.image,
    sold_out: p.soldOut,
    sort: index,
    hotspots: hotspots[p.id] ?? [],
    colors: p.colors.map((c) => ({
      name: c.name,
      hex: c.hex,
      image: c.image ?? null,
      // One variant per size, with the same demo stock the frontend shows today.
      variants: p.sizes.map((size) => ({ size, stock: stockFor(p, c.name, size) })),
    })),
  })),
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data, null, 2));
console.log('Wrote', data.products.length, 'products to', out);
