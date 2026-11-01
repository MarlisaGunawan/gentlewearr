import { Link } from 'react-router-dom';
import { formatPrice, productUrl } from '../../config/catalog';

// White card with a row of products and "Shop now" buttons.
export default function ShopRow({ id, products, title = 'Shop the essentials' }) {
  return (
    <section id={id} className="card shop-row" aria-label={title} data-reveal-stagger data-reveal-scale>
      {products.map((product) => (
        <article key={product.id} className="shop-item">
          <div className="shop-item__media" data-parallax-scope>
            <img src={product.image} alt={product.name} loading="lazy" data-parallax="7" />
          </div>
          <h3>{product.name.split(' — ')[0]}</h3>
          <p>{formatPrice(product.price)}</p>
          <Link className="pill pill--outline" to={productUrl(product)}>
            Shop now
          </Link>
        </article>
      ))}
    </section>
  );
}
