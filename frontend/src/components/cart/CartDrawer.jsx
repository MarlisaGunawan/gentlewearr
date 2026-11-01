import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FREE_SHIPPING_MIN, formatPrice, productUrl, stockFor } from '../../config/catalog';
import { useCart } from '../../context/CartContext';
import { useSectionNav } from '../../hooks/useSectionNav';

/** Slide-in cart panel on the right. Opened from the navbar cart icon. */
export default function CartDrawer() {
  const cart = useCart();
  const navigate = useNavigate();
  const goToSection = useSectionNav();
  const panelRef = useRef(null);
  const { drawerOpen: open, closeDrawer } = cart;

  // Escape closes; focus moves into the panel when it opens.
  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeDrawer]);

  const toFreeShipping = Math.max(0, FREE_SHIPPING_MIN - cart.subtotal);

  const checkout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const startShopping = () => {
    closeDrawer();
    goToSection('collection');
  };

  return (
    <div className={'drawer' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="drawer__backdrop" onClick={closeDrawer} />

      <aside
        ref={panelRef}
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
      >
        <header className="drawer__head">
          <h2>
            Your cart <span>({cart.count})</span>
          </h2>
          <button type="button" className="drawer__close" onClick={closeDrawer} aria-label="Close cart">
            ×
          </button>
        </header>

        {cart.items.length === 0 ? (
          <div className="drawer__empty">
            <p className="drawer__empty-title">Your cart is empty</p>
            <p>Add a few pieces you love, then check out here.</p>
            <button type="button" className="btn btn--dark" onClick={startShopping}>
              Start shopping
            </button>
          </div>
        ) : (
          <>
            <p className="drawer__shipping">
              {toFreeShipping > 0
                ? 'Add ' + formatPrice(toFreeShipping) + ' more for free shipping'
                : 'You get free regular shipping 🎉'}
            </p>

            <ul className="drawer__list">
              {cart.items.map((item) => {
                const max = stockFor(item.product, item.color, item.size);
                return (
                  <li key={item.key} className="cart-line">
                    <Link to={productUrl(item.product)} onClick={closeDrawer} className="cart-line__media">
                      <img src={item.image} alt="" />
                    </Link>
                    <div className="cart-line__body">
                      <p className="cart-line__name">{item.name}</p>
                      <p className="cart-line__meta">
                        {item.color} · {item.size}
                      </p>
                      <div className="cart-line__row">
                        <div className="stepper" aria-label="Quantity">
                          <button type="button" onClick={() => cart.setQty(item.key, item.qty - 1)} aria-label="Decrease">
                            −
                          </button>
                          <span>{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => cart.setQty(item.key, item.qty + 1)}
                            disabled={item.qty >= max}
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                        <strong>{formatPrice(item.lineTotal)}</strong>
                      </div>
                      <button type="button" className="cart-line__remove" onClick={() => cart.remove(item.key)}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="drawer__foot">
              <div className="drawer__total">
                <span>Subtotal</span>
                <strong>{formatPrice(cart.subtotal)}</strong>
              </div>
              <p className="drawer__note">Shipping is calculated at checkout.</p>
              <button type="button" className="btn btn--dark btn--block" onClick={checkout}>
                Checkout
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
