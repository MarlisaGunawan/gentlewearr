import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { rupiah } from '../components/chart';
import StatusBadge from '../components/StatusBadge';
import { useAdminData } from '../useAdminData';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'expired', label: 'Expired' },
];

/** Every payment attempt from Midtrans (or the mock gateway). */
export default function PaymentsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page, ...(status && { status }), ...(search && { search }) }).toString();
  const { data, error } = useAdminData('/payments?' + query);

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Payments</h1>
          <p className="adm-muted">Payment attempts reported by Midtrans Snap (sandbox) through the webhook.</p>
        </div>
      </header>

      {data && (
        <section className="adm-tiles adm-tiles--2" aria-label="Payment summary">
          <article className="adm-tile">
            <h3>Collected</h3>
            <p>{rupiah(data.totals.paid)}</p>
          </article>
          <article className="adm-tile">
            <h3>Payment attempts</h3>
            <p>{data.totals.count}</p>
          </article>
        </section>
      )}

      <section className="adm-card adm-card--flush">
        <div className="adm-card__head">
          <div className="adm-chips" role="group" aria-label="Payment status">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={status === f.id} onClick={() => (setStatus(f.id), setPage(1))}>
                {f.label}
              </button>
            ))}
          </div>
          <label className="adm-field-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" placeholder="Order code or name" value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} aria-label="Search payments" />
          </label>
        </div>
        {error && <p className="adm-error adm-card__pad">{error}</p>}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col" className="adm-hide-sm">
                  Method
                </th>
                <th scope="col">Status</th>
                <th scope="col" className="adm-hide-sm">
                  Date
                </th>
                <th scope="col" className="adm-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((p, i) => (
                <tr key={p.code + i}>
                  <td className="adm-mono">
                    <Link to={'/admin/orders/' + p.code}>{p.code}</Link>
                  </td>
                  <td>{p.customer_name}</td>
                  <td className="adm-hide-sm adm-muted">
                    {p.provider}
                    {p.payment_type ? ' · ' + p.payment_type.replace(/_/g, ' ') : ''}
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="adm-hide-sm adm-muted">{new Date(p.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="adm-right adm-mono">{rupiah(p.amount)}</td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-empty">
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="adm-pager">
            <span>
              Page {data.meta.page} of {data.meta.last_page} · {data.meta.total} payments
            </span>
            <div>
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={page >= data.meta.last_page} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
