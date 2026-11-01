import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../../config/catalog';

const METHODS = [
  { id: 'va', label: 'Virtual account (BCA, BNI, BRI)' },
  { id: 'qris', label: 'QRIS / GoPay / ShopeePay' },
  { id: 'card', label: 'Credit or debit card' },
];

/**
 * Stand-in for the Midtrans Snap popup while there is no backend.
 * Lets you simulate the three outcomes Midtrans can send back.
 */
export default function MockPaymentDialog({ order, onResult }) {
  const [method, setMethod] = useState(METHODS[0].id);
  const [processing, setProcessing] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && !processing && onResult('cancelled');
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onResult, processing]);

  const finish = (status) => {
    setProcessing(true);
    setTimeout(() => onResult(status), 900); // short "processing" moment, like a real gateway
  };

  return (
    <div className="mock-pay">
      <div className="mock-pay__backdrop" />
      <div ref={dialogRef} className="mock-pay__sheet" role="dialog" aria-modal="true" aria-label="Payment" tabIndex={-1}>
        <header className="mock-pay__head">
          <span className="mock-pay__badge">Sandbox · mock</span>
          <button type="button" className="drawer__close" aria-label="Cancel payment" disabled={processing} onClick={() => onResult('cancelled')}>
            ×
          </button>
        </header>

        <p className="mock-pay__label">Order {order.id}</p>
        <p className="mock-pay__amount">{formatPrice(order.total)}</p>

        <fieldset className="mock-pay__methods" disabled={processing}>
          <legend>Choose a payment method</legend>
          {METHODS.map((m) => (
            <label key={m.id} className={'mock-pay__method' + (m.id === method ? ' is-active' : '')}>
              <input type="radio" name="method" value={m.id} checked={m.id === method} onChange={() => setMethod(m.id)} />
              {m.label}
            </label>
          ))}
        </fieldset>

        <button type="button" className="btn btn--dark btn--block" disabled={processing} onClick={() => finish('paid')}>
          {processing ? 'Processing…' : 'Pay ' + formatPrice(order.total)}
        </button>
        <div className="mock-pay__alt">
          <button type="button" disabled={processing} onClick={() => finish('pending')}>
            Simulate pending
          </button>
          <button type="button" disabled={processing} onClick={() => finish('failed')}>
            Simulate failure
          </button>
        </div>
        <p className="mock-pay__note">
          No real money moves. With the Laravel backend connected, this becomes the Midtrans Snap popup.
        </p>
      </div>
    </div>
  );
}
