import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { rupiah } from '../components/chart';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import { useAdminData } from '../useAdminData';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'waiting_payment', label: 'Waiting payment' },
  { id: 'paid', label: 'Paid' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [page, setPage] = useState(1);
  const urlSearch = params.get('search') ?? '';
  useEffect(() => setSearch(urlSearch), [urlSearch]);
  const setStatus = (id) => (setParams(id ? { status: id } : {}), setPage(1));
  const navigate = useNavigate();
  const query = new URLSearchParams({ page, ...(status && { status }), ...(search && { search }) }).toString();
  const { data, error, loading } = useAdminData('/orders' + (query ? '?' + query : ''));

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Orders</h1>
          <p className="adm-muted">Payments update automatically from Midtrans. Pack and ship paid orders here.</p>
        </div>
      </header>

      {error && <p className="adm-error">{error}</p>}

      <section className="adm-card adm-card--flush">
        <div className="adm-card__head">
          <div className="adm-chips" role="group" aria-label="Order status">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={status === f.id} onClick={() => setStatus(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <label className="adm-field-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" placeholder="Order code, name or email" value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} aria-label="Search orders" />
          </label>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--click">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col" className="adm-right adm-hide-sm">
                  Items
                </th>
                <th scope="col" className="adm-hide-sm">
                  Payment
                </th>
                <th scope="col">Status</th>
                <th scope="col" className="adm-hide-sm">
                  Date
                </th>
                <th scope="col" className="adm-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((o) => (
                <tr key={o.code} onClick={() => navigate('/admin/orders/' + o.code)}>
                  <td className="adm-mono">
                    <Link to={'/admin/orders/' + o.code} onClick={(e) => e.stopPropagation()}>
                      {o.code}
                    </Link>
                  </td>
                  <td>
                    <span className="adm-person">
                      <Avatar name={o.customer_name} size={26} />
                      <span>
                        {o.customer_name}
                        <em>{o.customer_email}</em>
                      </span>
                    </span>
                  </td>
                  <td className="adm-right adm-mono adm-hide-sm">{o.items_count}</td>
                  <td className="adm-muted adm-hide-sm">{o.payment_mode}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="adm-muted adm-hide-sm">{new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="adm-right adm-mono">{rupiah(o.total)}</td>
                </tr>
              ))}
              {loading && !data && (
                <tr>
                  <td colSpan={7} className="adm-empty">
                    Loading…
                  </td>
                </tr>
              )}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="adm-empty">
                    No orders here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="adm-pager">
            <span>
              Page {data.meta.page} of {data.meta.last_page} · {data.meta.total} orders
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
