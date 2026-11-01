import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { rupiah } from '../components/chart';
import { useAdminData } from '../useAdminData';

/** Customers, grouped by email from their orders. */
export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const { data, error } = useAdminData('/customers' + (search ? '?search=' + encodeURIComponent(search) : ''));

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Customers</h1>
          <p className="adm-muted">Everyone who has checked out, with their orders and what they have paid.</p>
        </div>
      </header>

      <section className="adm-card adm-card--flush">
        <div className="adm-card__head">
          <h2>
            All customers <span className="adm-count">{data?.data.length ?? 0}</span>
          </h2>
          <label className="adm-field-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search customers" />
          </label>
        </div>
        {error && <p className="adm-error adm-card__pad">{error}</p>}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col" className="adm-hide-sm">
                  Phone
                </th>
                <th scope="col" className="adm-hide-sm">
                  City
                </th>
                <th scope="col" className="adm-right">
                  Orders
                </th>
                <th scope="col" className="adm-right">
                  Spent
                </th>
                <th scope="col" className="adm-hide-sm">
                  Last order
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((c) => (
                <tr key={c.email}>
                  <td>
                    <span className="adm-person">
                      <Avatar name={c.name} size={28} />
                      <span>
                        <Link to={'/admin/orders?search=' + encodeURIComponent(c.email)}>{c.name}</Link>
                        <em>{c.email}</em>
                      </span>
                    </span>
                  </td>
                  <td className="adm-hide-sm adm-muted adm-mono">{c.phone}</td>
                  <td className="adm-hide-sm adm-muted">{c.city}</td>
                  <td className="adm-right adm-mono">{c.orders}</td>
                  <td className="adm-right adm-mono">{rupiah(c.spent)}</td>
                  <td className="adm-hide-sm adm-muted">{new Date(c.last_order_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-empty">
                    No customers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
