import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FREE_SHIPPING_MIN,
  categories,
  formatPrice,
  getCategory,
  productsInCategory,
} from '../config/catalog';
import { useCart } from '../context/CartContext';
import EditorialStage from '../components/shop/EditorialStage';
import ProductDetail from '../components/shop/ProductDetail';

/**
 * /shop/:category — product detail page per category.
 * Left: category info, promo, best seller. Centre: the editorial stage (tilting
 * photo, colour reveal, detail hotspots). Right: the product's options + the
 * rest of the category + a cart summary.
 */
export default function CategoryPage() {
  const { category: slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [color, setColor] = useState(null); // selected colour of the active product
  const cart = useCart();

  const category = getCategory(slug);
  const items = useMemo(() => (category ? productsInCategory(category.name) : []), [category]);

  // The selected product lives in the URL (?product=gw-104) so it can be shared.
  const requested = items.findIndex((p) => p.id === params.get('product'));
  const activeIndex = requested >= 0 ? requested : 0;
  const active = items[activeIndex];

  const pick = (index) => setParams({ product: items[index].id }, { replace: true });

  if (!category) return <Navigate to="/shop/t-shirts" replace />;

  const bestSeller = items.find((p) => p.badge === 'featured') ?? items[0];

  return (
    <main className="shop">
      <div className="shop__top">
        <nav className="shop__crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <span>Shop</span> / <strong>{category.name}</strong>
        </nav>
        <div className="shop__tabs" role="tablist" aria-label="Categories">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={'/shop/' + c.slug}
              role="tab"
              aria-selected={c.slug === slug}
              className={c.slug === slug ? 'is-active' : undefined}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="shop__grid">
        {/* Left: category story, promo, best seller */}
        <aside className="shop__aside">
          <h2 className="shop__title">{category.title}</h2>
          <p className="shop__desc">{category.description}</p>
          <p className="shop__count">{items.length} pieces in this edit</p>

          <div className="promo">
            <p className="promo__big">Free shipping</p>
            <p>on orders over {formatPrice(FREE_SHIPPING_MIN)}</p>
            <span className="promo__code">Automatic at checkout</span>
          </div>

          <button type="button" className="best" onClick={() => pick(items.indexOf(bestSeller))}>
            <span className="best__label">Best seller</span>
            <img src={bestSeller.image} alt="" />
            <span className="best__name">{bestSeller.name}</span>
            <span className="best__price">{formatPrice(bestSeller.price)}</span>
          </button>
        </aside>

        {/* Centre: editorial stage */}
        <section className="shop__stage" aria-label={category.name + ' products'}>
          <EditorialStage product={active} color={color} />
          <div className="shop__controls">
            <button
              type="button"
              className="round-btn"
              aria-label="Previous product"
              onClick={() => pick((activeIndex - 1 + items.length) % items.length)}
            >
              ←
            </button>
            <span className="shop__index">
              {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              className="round-btn"
              aria-label="Next product"
              onClick={() => pick((activeIndex + 1) % items.length)}
            >
              →
            </button>
          </div>
          <p className="shop__hint">Tap the dots for details · pick a colour to see it</p>
        </section>

        {/* Right: details, the rest of the category, cart summary */}
        <section className="shop__detail">
          <ProductDetail product={active} onColorChange={setColor} />

          <div className="curated">
            <h3>In this edit ({items.length})</h3>
            <ul>
              {items.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={'curated__item' + (i === activeIndex ? ' is-active' : '')}
                    onClick={() => pick(i)}
                  >
                    <img src={p.image} alt="" />
                    <span className="curated__name">
                      {p.name}
                      {p.soldOut && <em>Sold out</em>}
                    </span>
                    <span className="curated__price">{formatPrice(p.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="summary">
            <div>
              <span>Cart · {cart.count} items</span>
              <strong>{formatPrice(cart.subtotal)}</strong>
            </div>
            <Link to="/checkout" className={'btn btn--dark' + (cart.count === 0 ? ' is-disabled' : '')} aria-disabled={cart.count === 0}>
              Checkout
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
