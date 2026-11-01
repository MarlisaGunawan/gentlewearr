import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice, nameFor, stockFor } from '../../config/catalog';
import { useCart } from '../../context/CartContext';

/**
 * Right-hand panel: name, price, colour + size (each variant has its own stock),
 * quantity, and the Add to cart / Buy now buttons.
 * Reports the chosen colour ({ name, hex, image }) through `onColorChange` (the stage uses it).
 */
export default function ProductDetail({ product, onColorChange }) {
  const cart = useCart();
  const navigate = useNavigate();
  const [color, setColor] = useState(product.colors[0].name);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Different product → reset the choices; pick the first size that is in stock.
  useEffect(() => {
    const firstColor = product.colors[0].name;
    setColor(firstColor);
    setSize(product.sizes.find((s) => stockFor(product, firstColor, s) > 0) ?? null);
    setQty(1);
    setAdded(false);
  }, [product]);

  // Tell the page which colour is selected, so the stage can show it.
  useEffect(() => {
    const chosen = product.colors.find((c) => c.name === color) ?? product.colors[0];
    onColorChange?.(chosen);
  }, [product, color, onColorChange]);

  const stock = size ? stockFor(product, color, size) : 0;
  const soldOut = product.soldOut || product.colors.every((c) => product.sizes.every((s) => stockFor(product, c.name, s) === 0));

  const chooseColor = (name) => {
    setColor(name);
    // Keep the size if that variant exists in the new colour, otherwise pick another.
    if (!size || stockFor(product, name, size) === 0) {
      setSize(product.sizes.find((s) => stockFor(product, name, s) > 0) ?? null);
    }
    setQty(1);
  };

  const addToCart = () => {
    cart.add({ productId: product.id, color, size, qty });
    setAdded(true);
    cart.openDrawer();
  };

  const buyNow = () => {
    cart.add({ productId: product.id, color, size, qty });
    navigate('/checkout');
  };

  return (
    <div className="pdp">
      <p className="pdp__line">
        {product.line} · <span>{product.code}</span>
      </p>
      <h1 className="pdp__name">{nameFor(product, color)}</h1>
      <p className="pdp__price">{formatPrice(product.price)}</p>
      <p className="pdp__desc">{product.description}</p>

      <fieldset className="pdp__group">
        <legend>
          Colour <span>{color}</span>
        </legend>
        <div className="swatches">
          {product.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              className={'swatch' + (c.name === color ? ' is-active' : '')}
              style={{ '--swatch': c.hex }}
              aria-label={c.name}
              aria-pressed={c.name === color}
              onClick={() => chooseColor(c.name)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="pdp__group">
        <legend>
          Size <span>{size ?? '—'}</span>
        </legend>
        <div className="sizes">
          {product.sizes.map((s) => {
            const available = stockFor(product, color, s) > 0;
            return (
              <button
                key={s}
                type="button"
                className={'size' + (s === size ? ' is-active' : '')}
                disabled={!available}
                aria-pressed={s === size}
                onClick={() => {
                  setSize(s);
                  setQty(1);
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className={'pdp__stock' + (stock > 0 && stock <= 3 ? ' is-low' : '')} aria-live="polite">
        {soldOut
          ? 'Sold out — restocking soon'
          : !size
            ? 'This colour is sold out'
            : stock <= 3
              ? 'Only ' + stock + ' left in this size'
              : 'In stock · ' + stock + ' available'}
      </p>

      <div className="pdp__actions">
        <div className="stepper stepper--lg" aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease">
            −
          </button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={qty >= stock} aria-label="Increase">
            +
          </button>
        </div>
        <button type="button" className="btn btn--dark btn--grow" disabled={!size || soldOut} onClick={addToCart}>
          {added ? 'Added ✓ Add more' : 'Add to cart'}
        </button>
      </div>
      <button type="button" className="btn btn--outline btn--block" disabled={!size || soldOut} onClick={buyNow}>
        Buy now
      </button>
    </div>
  );
}
