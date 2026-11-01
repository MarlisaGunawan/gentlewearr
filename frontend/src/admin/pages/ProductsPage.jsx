import { Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rupiah } from '../components/chart';
import ProductDrawer from '../components/ProductDrawer';
import { useAdminData } from '../useAdminData';

const PAGE = 10;

/** Store Management: the product list; clicking a row opens the Product Detail panel. */
export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const query = new URLSearchParams({ ...(search && { search }), ...(category && { category }) }).toString();
  const { data, error, loading } = useAdminData('/products' + (query ? '?' + query : ''));
  const open = params.get('product');

  const show = (sku) => setParams(sku ? { product: sku } : {}, { replace: true });
  const close = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const products = data?.products ?? [];
  const pages = Math.max(1, Math.ceil(products.length / PAGE));
  const current = Math.min(page, pages - 1);
  const visible = products.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Store Management</h1>
          <p className="adm-muted">Every product with its price, stock and sales. Click a product to see its details.</p>
        </div>
        <Link to="/admin/products/new" className="adm-btn adm-btn--dark">
          <Plus size={16} aria-hidden="true" /> Add product
        </Link>
      </header>

      <section className="adm-card adm-card--flush">
        <div className="adm-card__head">
          <label className="adm-field-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" placeholder="Search anything" value={search} onChange={(e) => (setSearch(e.target.value), setPage(0))} aria-label="Search products" />
          </label>
          <div className="adm-chips" role="group" aria-label="Category">
            <button type="button" aria-pressed={category === ''} onClick={() => (setCategory(''), setPage(0))}>
              All
            </button>
            {data?.categories.map((c) => (
              <button key={c.slug} type="button" aria-pressed={category === c.slug} onClick={() => (setCategory(c.slug), setPage(0))}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="adm-error adm-card__pad">{error}</p>}

        <div className="adm-table-wrap">
          <table className="adm-table adm-table--click adm-table--products">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className="adm-hide-sm">
                  Category
                </th>
                <th scope="col" className="adm-right">
                  Price
                </th>
                <th scope="col" className="adm-right">
                  Stock
                </th>
                <th scope="col" className="adm-right adm-hide-sm">
                  Sold
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.sku} className={open === p.sku ? 'is-selected' : undefined} onClick={() => show(p.sku)}>
                  <td>
                    <span className="adm-product">
                      <img src={p.image} alt="" />
                      <span>
                        <button type="button" className="adm-link-btn" onClick={(e) => (e.stopPropagation(), show(p.sku))}>
                          {p.name.split(' — ')[0]}
                        </button>
                        <em>{p.sku}</em>
                      </span>
                    </span>
                  </td>
                  <td className="adm-hide-sm adm-muted">{p.category}</td>
                  <td className="adm-right adm-mono">{rupiah(p.price)}</td>
                  <td className="adm-right adm-mono">
                    {p.stock}
                    {p.low_variants > 0 && <span className="badge badge--warning adm-ml">{p.low_variants} low</span>}
                  </td>
                  <td className="adm-right adm-mono adm-hide-sm">{p.sold}</td>
                  <td>{p.is_active ? <span className="badge badge--good">Active</span> : <span className="badge badge--muted">Hidden</span>}</td>
                </tr>
              ))}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-empty">
                    No products match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="adm-pager">
          <span>
            Showing {products.length ? current * PAGE + 1 : 0} to {Math.min(products.length, (current + 1) * PAGE)} of {products.length} entries
          </span>
          <div>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous
            </button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>

      <ProductDrawer sku={open} onClose={close} />
    </>
  );
}
