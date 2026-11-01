import { Link } from 'react-router-dom';
import { categorySlug, formatPrice, productUrl } from '../../config/catalog';
import Icon from './Icon';

// Product tile used inside the coloured collection panels.
// Catalog products link to their detail page; the rest are display-only.
export default function ProductCard({ product }) {
  const linked = Boolean(categorySlug(product.category));
  const Tag = linked ? Link : 'article';

  return (
    <Tag className="product-card" {...(linked ? { to: productUrl(product) } : {})}>
      <div className="product-card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge === 'copy' && (
          <span className="product-card__icon">
            <Icon name="copy" size={11} />
          </span>
        )}
        {product.badge === 'featured' && <span className="product-card__badge">on featured</span>}
        <span className="product-card__code">{product.code}</span>
      </div>

      <p className="product-card__line">{product.line}</p>
      <h3 className="product-card__name">{product.name}</h3>
      <p className="product-card__price">
        {formatPrice(product.price)}
        {product.soldOut && <span className="product-card__soldout">Sold out</span>}
      </p>
    </Tag>
  );
}
