import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdmin } from '../AdminAuth';
import { useAdminData } from '../useAdminData';

const TABS = [
  { id: '', label: 'All variants' },
  { id: 'low', label: 'Low stock' },
  { id: 'out', label: 'Out of stock' },
];

/** One variant row: stock and minimum can be changed in place. */
function StockRow({ variant, onSaved }) {
  const { request } = useAdmin();
  const [stock, setStock] = useState(variant.stock);
  const [min, setMin] = useState(variant.min_stock);
  const [state, setState] = useState('');
  const dirty = Number(stock) !== variant.stock || Number(min) !== variant.min_stock;

  const save = async () => {
    setState('saving');
    try {
      await request('/variants/' + variant.id, { method: 'PUT', body: { stock: Number(stock), min_stock: Number(min), note: 'Inventory page' } });
      setState('saved');
      onSaved();
    } catch (e) {
      setState(e.message);
    }
  };

  const tone = variant.stock === 0 ? 'critical' : variant.stock <= variant.min_stock ? 'warning' : 'good';

  return (
    <tr>
      <td>
        <span className="adm-product">
          <img src={variant.image} alt="" />
          <span>
            <Link to={'/admin/products?product=' + variant.product_sku}>{variant.name}</Link>
            <em>{variant.sku}</em>
          </span>
        </span>
      </td>
      <td>
        <span className="adm-dot" style={{ background: variant.hex }} /> {variant.color}
      </td>
      <td className="adm-mono">{variant.size}</td>
      <td>
        <span className={'badge badge--' + tone}>{tone === 'critical' ? 'Out' : tone === 'warning' ? 'Low' : 'OK'}</span>
      </td>
      <td className="adm-right">
        <input className="adm-num" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} aria-label={'Stock for ' + variant.sku} />
      </td>
      <td className="adm-right adm-hide-sm">
        <input className="adm-num" type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} aria-label={'Minimum for ' + variant.sku} />
      </td>
      <td className="adm-right">
        {dirty ? (
          <button type="button" className="adm-btn adm-btn--dark adm-btn--sm" onClick={save} disabled={state === 'saving'}>
            Save
          </button>
        ) : (
          <span className={state && state !== 'saved' ? 'adm-error-text' : 'adm-muted'}>{state === 'saved' ? 'Saved ✓' : state}</span>
        )}
      </td>
    </tr>
  );
}

export default function InventoryPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') ?? '';
  const [search, setSearch] = useState('');
  const query = new URLSearchParams({ ...(filter && { filter }), ...(search && { search }) }).toString();
  const { data, error, reload } = useAdminData('/inventory' + (query ? '?' + query : ''));

  const tiles = data && [
    { label: 'Units in stock', value: data.summary.units.toLocaleString('id-ID') },
    { label: 'Variants', value: data.summary.variants },
    { label: 'Low stock', value: data.summary.low, tone: 'warning' },
    { label: 'Out of stock', value: data.summary.out, tone: 'critical' },
  ];

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Inventory</h1>
          <p className="adm-muted">Stock per colour and size. Paid orders take stock out automatically; changes here are logged.</p>
        </div>
      </header>

      {tiles && (
        <section className="adm-tiles" aria-label="Stock summary">
          {tiles.map((t) => (
            <article key={t.label} className={'adm-tile' + (t.tone ? ' adm-tile--' + t.tone : '')}>
              <h3>{t.label}</h3>
              <p>{t.value}</p>
            </article>
          ))}
        </section>
      )}

      <div className="adm-grid adm-grid--orders">
        <section className="adm-card adm-card--flush">
          <div className="adm-card__head">
            <div className="adm-chips" role="group" aria-label="Stock filter">
              {TABS.map((t) => (
                <button key={t.id} type="button" aria-pressed={filter === t.id} onClick={() => setParams(t.id ? { filter: t.id } : {})}>
                  {t.label}
                </button>
              ))}
            </div>
            <label className="adm-field-search">
              <Search size={15} aria-hidden="true" />
              <input type="search" placeholder="SKU or product" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search variants" />
            </label>
          </div>
          {error && <p className="adm-error adm-card__pad">{error}</p>}
          <div className="adm-table-wrap adm-table-wrap--tall">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Colour</th>
                  <th scope="col">Size</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="adm-right">
                    Stock
                  </th>
                  <th scope="col" className="adm-right adm-hide-sm">
                    Min
                  </th>
                  <th scope="col" className="adm-right">
                    <span className="visually-hidden">Save</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((v) => (
                  <StockRow key={v.id + ':' + v.stock + ':' + v.min_stock} variant={v} onSaved={reload} />
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="adm-empty">
                      Nothing here — every variant is above its minimum.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card__title">
            <h2>Latest movements</h2>
          </div>
          {data?.movements.length === 0 && <p className="adm-muted">No stock changes yet.</p>}
          <ul className="adm-list">
            {data?.movements.map((m, i) => (
              <li key={i}>
                <span>
                  <span className="adm-mono">{m.sku}</span>
                  <em>
                    {m.reason}
                    {m.note ? ' · ' + m.note : ''} · {new Date(m.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                  </em>
                </span>
                <span className={'badge ' + (m.change < 0 ? 'badge--warning' : 'badge--good')}>
                  {m.change > 0 ? '+' : ''}
                  {m.change} → {m.stock_after}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
