import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatPrice } from '../../config/catalog';
import { useAdmin } from '../AdminAuth';
import StatusBadge from '../components/StatusBadge';
import { useAdminData } from '../useAdminData';

// What staff can do next, depending on the current status.
const NEXT = {
  paid: { status: 'packed', label: 'Mark as packed' },
  packed: { status: 'shipped', label: 'Mark as shipped' },
  shipped: { status: 'completed', label: 'Mark as completed' },
};

export default function OrderDetailPage() {
  const { code } = useParams();
  const { request } = useAdmin();
  const { data, setData, error, loading } = useAdminData('/orders/' + code);
  const [tracking, setTracking] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <p className="adm-muted">Loading order…</p>;
  if (error) return <p className="adm-error">{error}</p>;

  const order = data.data;
  const next = NEXT[order.status];

  const advance = async () => {
    setBusy(true);
    setActionError('');
    try {
      setData(await request('/orders/' + code, { method: 'PUT', body: { status: next.status, tracking_number: tracking || order.tracking_number } }));
    } catch (e) {
      setActionError(e.errors?.tracking_number?.[0] ?? e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="adm-head">
        <div>
          <Link to="/admin/orders" className="adm-back">
            ← Orders
          </Link>
          <h1>
            {order.code} <StatusBadge status={order.status} />
          </h1>
          <p className="adm-muted">
            {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} · {order.payment_mode} payment
          </p>
        </div>
      </header>

      <div className="adm-grid">
        <section className="adm-card adm-card--wide">
          <h2>Items</h2>
          <table className="adm-table">
            <tbody>
              {order.items.map((i) => (
                <tr key={i.sku}>
                  <td>
                    <span className="adm-product">
                      <img src={i.image} alt="" />
                      <span>
                        {i.name}
                        <em>
                          {i.color} · {i.size} · {i.sku}
                        </em>
                      </span>
                    </span>
                  </td>
                  <td>
                    {i.qty} × {formatPrice(i.price)}
                  </td>
                  <td className="adm-right">{formatPrice(i.qty * i.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="adm-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping · {order.shipping.label}</dt>
              <dd>{order.shipping.cost ? formatPrice(order.shipping.cost) : 'Free'}</dd>
            </div>
            <div className="is-total">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="adm-card">
          <h2>Fulfilment</h2>
          {order.tracking_number && <p>Tracking: <strong>{order.tracking_number}</strong></p>}
          {next ? (
            <>
              {next.status === 'shipped' && (
                <label className="adm-field">
                  <span>Tracking number</span>
                  <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. JNE123456789" />
                </label>
              )}
              {actionError && <p className="adm-error">{actionError}</p>}
              <button type="button" className="adm-btn adm-btn--dark adm-btn--block" onClick={advance} disabled={busy}>
                {busy ? 'Saving…' : next.label}
              </button>
            </>
          ) : (
            <p className="adm-muted">
              {order.status === 'completed' ? 'This order is done.' : 'Waiting for payment — nothing to ship yet.'}
            </p>
          )}

          <h2 className="adm-mt">Customer</h2>
          <p>
            <strong>{order.customer.name}</strong>
            <br />
            {order.customer.email}
            <br />
            {order.customer.phone}
          </p>
          <p className="adm-muted">
            {order.customer.address}, {order.customer.city}
            {order.customer.province ? ', ' + order.customer.province : ''} {order.customer.postal_code}
          </p>
        </section>

        <section className="adm-card">
          <h2>Payment history</h2>
          {order.payments?.length ? (
            <ul className="adm-rank">
              {order.payments.map((p, i) => (
                <li key={i}>
                  <span>
                    {p.provider} {p.payment_type ? '· ' + p.payment_type : ''}
                    <em>{new Date(p.created_at).toLocaleString('id-ID')}</em>
                  </span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">No payment attempts yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
