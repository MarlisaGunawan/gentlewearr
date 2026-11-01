import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatPrice } from '../config/catalog';
import { fetchOrder } from '../services/orders';

const STATUS = {
  paid: { label: 'Payment received', text: 'Thank you! We are packing your order and will email you the tracking number.' },
  packed: { label: 'Packed', text: 'Your order is packed and will be handed to the courier soon.' },
  shipped: { label: 'On its way', text: 'Your order has been shipped.' },
  completed: { label: 'Delivered', text: 'Enjoy your new pieces!' },
  pending: { label: 'Waiting for payment', text: 'Finish the payment with the instructions from the payment page. We will confirm by email.' },
  waiting_payment: { label: 'Waiting for payment', text: 'This order has not been paid yet.' },
  failed: { label: 'Payment failed', text: 'The payment did not go through. Your items are still available — please try again.' },
  cancelled: { label: 'Payment cancelled', text: 'You closed the payment window. You can try again from your cart.' },
  expired: { label: 'Payment expired', text: 'The payment time ran out. Please place the order again.' },
};

// Statuses that use the green "good" colour on the status card.
const DONE = ['paid', 'packed', 'shipped', 'completed'];

/** /orders/:orderId — shows the result of a checkout, read from the server. */
export default function OrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined); // undefined = loading, null = not found
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (sync = false) => {
      try {
        setOrder(await fetchOrder(orderId, { sync }));
      } catch {
        setOrder(null);
      }
    },
    [orderId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  if (order === undefined) {
    return (
      <main className="checkout checkout--empty">
        <p>Loading your order…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="checkout checkout--empty">
        <h1>Order not found</h1>
        <p>We couldn't find order {orderId} on this device.</p>
        <Link to="/" className="btn btn--dark">
          Back to home
        </Link>
      </main>
    );
  }

  const status = STATUS[order.status] ?? STATUS.waiting_payment;

  return (
    <main className="order">
      <section className={'order__status order__status--' + (DONE.includes(order.status) ? 'paid' : order.status)}>
        <span className="order__dot" aria-hidden="true" />
        <p className="order__id">Order {order.id}</p>
        <h1>{status.label}</h1>
        <p>{status.text}</p>
        {order.trackingNumber && <p className="order__ship">Tracking number: {order.trackingNumber}</p>}
        <div className="order__actions">
          <Link to="/shop/t-shirts" className="btn btn--dark">
            Continue shopping
          </Link>
          {['pending', 'waiting_payment'].includes(order.status) && (
            <button type="button" className="btn btn--outline" onClick={refresh} disabled={refreshing}>
              {refreshing ? 'Checking…' : 'Refresh status'}
            </button>
          )}
          {['failed', 'cancelled', 'expired'].includes(order.status) && (
            <Link to="/checkout" className="btn btn--outline">
              Try again
            </Link>
          )}
        </div>
      </section>

      <section className="order__card">
        <h2>Items</h2>
        <ul>
          {order.items.map((item) => (
            <li key={item.productId + item.color + item.size} className="sum-line">
              <span className="sum-line__media">
                <img src={item.image} alt="" />
                <em>{item.qty}</em>
              </span>
              <span className="sum-line__name">
                {item.name}
                <small>
                  {item.color} · {item.size}
                </small>
              </span>
              <strong>{formatPrice(item.price * item.qty)}</strong>
            </li>
          ))}
        </ul>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping · {order.shippingLabel}</dt>
            <dd>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</dd>
          </div>
          <div className="is-total">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <p className="order__ship">
          Ship to {order.customer.name}, {order.customer.address}, {order.customer.city} {order.customer.postalCode}
        </p>
      </section>
    </main>
  );
}
