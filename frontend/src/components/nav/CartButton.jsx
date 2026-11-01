import { useCart } from '../../context/CartContext';

/** Cart icon in the navbar with an item-count badge. Opens the cart drawer. */
export default function CartButton() {
  const { count, openDrawer } = useCart();

  return (
    <button
      type="button"
      className="nav-glass cart__button"
      aria-label={'Cart, ' + count + (count === 1 ? ' item' : ' items')}
      onClick={openDrawer}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h2.2l2.1 11h10.6l2-8H6.4" />
        <circle cx="9" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
      </svg>
      {count > 0 && (
        <span key={count} className="cart__badge" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}
