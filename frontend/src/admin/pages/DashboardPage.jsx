import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { rupiah, rupiahShort } from '../components/chart';
import KpiCard from '../components/KpiCard';
import RangeControl, { RANGES } from '../components/RangeControl';
import RevenueChart from '../components/RevenueChart';
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge';
import { useAdminData } from '../useAdminData';

const PAGE = 6;
const FILTERS = ['all', 'paid', 'waiting_payment', 'packed', 'shipped', 'completed', 'failed'];

/** Recent orders: status filter chips, sortable columns, pagination. */
function RecentOrders({ orders }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });
  const [page, setPage] = useState(0);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    orders.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [orders]);

  const rows = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return orders
      .filter((o) => filter === 'all' || o.status === filter)
      .sort((a, b) => (typeof a[sort.key] === 'number' ? a[sort.key] - b[sort.key] : String(a[sort.key]).localeCompare(String(b[sort.key]))) * dir);
  }, [orders, filter, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE, current * PAGE + PAGE);

  const toggle = (key) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
    setPage(0);
  };

  const th = (key, label, className = '') => {
    const sorted = sort.key === key;
    const Icon = !sorted ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th scope="col" className={className} aria-sort={sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className={'adm-sort' + (sorted ? ' is-sorted' : '')} onClick={() => toggle(key)}>
          {label} <Icon size={12} aria-hidden="true" />
        </button>
      </th>
    );
  };

  return (
    <section className="adm-card adm-card--flush">
      <div className="adm-card__head">
        <h2>
          Recent orders <span className="adm-count">{rows.length}</span>
        </h2>
        <div className="adm-chips" role="group" aria-label="Filter by status">
          {FILTERS.filter((f) => f === 'all' || counts[f]).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => (setFilter(f), setPage(0))}>
              {f === 'all' ? 'All' : STATUS_LABELS[f]} <span>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table adm-table--click">
          <thead>
            <tr>
              {th('code', 'Order')}
              {th('customer_name', 'Customer')}
              <th scope="col">Status</th>
              {th('created_at', 'Date', 'adm-hide-sm')}
              {th('total', 'Amount', 'adm-right')}
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.code} onClick={() => navigate('/admin/orders/' + o.code)}>
                <td className="adm-mono adm-muted">
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
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="adm-hide-sm adm-muted">{new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className={'adm-right adm-mono' + (['failed', 'cancelled', 'expired'].includes(o.status) ? ' adm-strike' : '')}>{rupiah(o.total)}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="adm-empty">
                  No orders here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="adm-pager">
        <span>{rows.length === 0 ? '0 results' : `${current * PAGE + 1}–${Math.min(rows.length, (current + 1) * PAGE)} of ${rows.length}`}</span>
        <div>
          <button type="button" className="adm-icon-btn" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span className="adm-mono">
            {current + 1}/{pages}
          </span>
          <button type="button" className="adm-icon-btn" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState('30d');
  const { data, error } = useAdminData('/dashboard?range=' + range);
  const rangeLong = RANGES.find((r) => r.id === range).long;

  if (error) return <p className="adm-error">{error}</p>;

  const categoryTotal = data ? data.categories.reduce((s, c) => s + c.value, 0) : 0;
  const categoryMax = data ? Math.max(1, ...data.categories.map((c) => c.value)) : 1;

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Overview</h1>
          <p className="adm-muted">{rangeLong} · compared with the previous period</p>
        </div>
        <RangeControl value={range} onChange={setRange} />
      </header>

      {!data ? (
        <p className="adm-muted">Loading dashboard…</p>
      ) : (
        <>
          <section className="adm-kpis" aria-label="Key metrics">
            {data.kpis.map((k) => (
              <KpiCard key={k.id} kpi={k} />
            ))}
          </section>

          <div className="adm-grid adm-grid--chart">
            <RevenueChart key={range} points={data.points} rangeLabel={rangeLong} />

            <section className="adm-card">
              <div className="adm-card__title">
                <h2>Revenue by category</h2>
                <span className="adm-mono adm-muted">{rupiahShort(categoryTotal)}</span>
              </div>
              {data.categories.length === 0 ? (
                <p className="adm-muted">No sales in this period yet.</p>
              ) : (
                <ul className="adm-bars">
                  {data.categories.map((c, i) => (
                    <li key={c.label}>
                      <div>
                        <span>{c.label}</span>
                        <span className="adm-mono">
                          {rupiahShort(c.value)} <em>{Math.round((c.value / categoryTotal) * 100)}%</em>
                        </span>
                      </div>
                      <span className="adm-bars__track" aria-hidden="true">
                        <span style={{ width: (c.value / categoryMax) * 100 + '%', opacity: 1 - i * 0.14 }} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="adm-ops">
                <Link to="/admin/orders?status=waiting_payment">
                  <strong>{data.waiting_payment}</strong> waiting payment
                </Link>
                <Link to="/admin/orders?status=paid">
                  <strong>{data.to_ship}</strong> to pack & ship
                </Link>
                <Link to="/admin/inventory">
                  <strong>{data.stock_units.toLocaleString('id-ID')}</strong> units in stock
                </Link>
              </div>
            </section>
          </div>

          <div className="adm-grid adm-grid--orders">
            <RecentOrders orders={data.recent_orders} />

            <section className="adm-card">
              <div className="adm-card__title">
                <h2>Low stock</h2>
                <Link to="/admin/inventory?filter=low" className="adm-link">
                  View all
                </Link>
              </div>
              {data.low_stock.length === 0 ? (
                <p className="adm-muted">All variants are above their minimum.</p>
              ) : (
                <ul className="adm-list">
                  {data.low_stock.map((v) => (
                    <li key={v.id}>
                      <Link to={'/admin/products/' + v.product_sku}>
                        {v.name}
                        <em>{v.variant}</em>
                      </Link>
                      <span className={'badge ' + (v.stock === 0 ? 'badge--critical' : 'badge--warning')}>{v.stock === 0 ? 'Out' : v.stock + ' left'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
