import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../AdminAuth';
import { useAdminData } from '../useAdminData';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const EMPTY = { sku: 'gw-', name: '', line: '', description: '', price: '', category_id: '', badge: '', image: '', is_active: true };

/** One variant row: edit stock and the low-stock level, then save. */
function VariantRow({ variant }) {
  const { request } = useAdmin();
  const [stock, setStock] = useState(variant.stock);
  const [min, setMin] = useState(variant.min_stock);
  const [state, setState] = useState(''); // '' | 'saving' | 'saved' | error text
  const dirty = Number(stock) !== variant.stock || Number(min) !== variant.min_stock;

  const save = async () => {
    setState('saving');
    try {
      const saved = await request('/variants/' + variant.id, {
        method: 'PUT',
        body: { stock: Number(stock), min_stock: Number(min), note: 'Updated in admin' },
      });
      Object.assign(variant, saved);
      setState('saved');
    } catch (e) {
      setState(e.message);
    }
  };

  return (
    <tr>
      <td>{variant.size}</td>
      <td className="adm-muted">{variant.sku}</td>
      <td>
        <input className="adm-num" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} aria-label={'Stock ' + variant.size} />
      </td>
      <td>
        <input className="adm-num" type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} aria-label={'Minimum ' + variant.size} />
      </td>
      <td>
        {Number(stock) <= Number(min) ? <span className="badge badge--warning">Low</span> : <span className="badge badge--good">OK</span>}
      </td>
      <td className="adm-right">
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={!dirty || state === 'saving'} onClick={save}>
          {state === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {state === 'saved' && !dirty && <span className="adm-ok"> ✓</span>}
        {state && !['saving', 'saved'].includes(state) && <small className="adm-error"> {state}</small>}
      </td>
    </tr>
  );
}

export default function ProductEditPage() {
  const { sku } = useParams();
  const isNew = sku === 'new';
  const navigate = useNavigate();
  const { request } = useAdmin();
  const list = useAdminData('/products'); // for the category list
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [colors, setColors] = useState([{ name: '', hex: '#1f1c19' }]);
  const [sizes, setSizes] = useState(ALL_SIZES);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    request('/products/' + sku)
      .then((p) => {
        setProduct(p);
        setForm({ ...EMPTY, ...p, line: p.line ?? '', description: p.description ?? '', badge: p.badge ?? '' });
      })
      .catch((e) => setMessage(e.message));
  }, [sku, isNew, request]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage('');
    const body = {
      category_id: Number(form.category_id),
      name: form.name,
      line: form.line || null,
      description: form.description || null,
      price: Number(form.price),
      badge: form.badge || null,
      image: form.image,
      is_active: form.is_active,
      ...(isNew ? { sku: form.sku, colors, sizes } : {}),
    };
    try {
      const saved = await request(isNew ? '/products' : '/products/' + sku, { method: isNew ? 'POST' : 'PUT', body });
      if (isNew) navigate('/admin/products/' + saved.sku, { replace: true });
      else {
        setProduct(saved);
        setMessage('Saved ✓');
      }
    } catch (e) {
      setErrors(Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, v]) => [k, v[0]])));
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this product and all its variants?')) return;
    await request('/products/' + sku, { method: 'DELETE' });
    navigate('/admin/products');
  };

  if (!isNew && !product) return <p className="adm-muted">{message || 'Loading product…'}</p>;

  const field = (name, label, props = {}) => (
    <label className={'adm-field' + (errors[name] ? ' has-error' : '')}>
      <span>{label}</span>
      <input value={form[name] ?? ''} onChange={set(name)} {...props} />
      {errors[name] && <small>{errors[name]}</small>}
    </label>
  );

  return (
    <>
      <header className="adm-head">
        <div>
          <Link to="/admin/products" className="adm-back">
            ← Products
          </Link>
          <h1>{isNew ? 'New product' : product.name}</h1>
          {!isNew && <p className="adm-muted">{product.sku} · {product.code}</p>}
        </div>
        {!isNew && (
          <button type="button" className="adm-btn adm-btn--ghost" onClick={remove}>
            Delete
          </button>
        )}
      </header>

      <form className="adm-card adm-form" onSubmit={save}>
        <h2>Details</h2>
        <div className="adm-form__grid">
          {isNew && field('sku', 'SKU (e.g. gw-160)')}
          {field('name', 'Name')}
          {field('line', 'Line (small text above the name)')}
          {field('price', 'Price (Rp)', { type: 'number', min: 1000 })}
          <label className={'adm-field' + (errors.category_id ? ' has-error' : '')}>
            <span>Category</span>
            <select value={form.category_id} onChange={set('category_id')}>
              <option value="">Choose…</option>
              {list.data?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id && <small>{errors.category_id}</small>}
          </label>
          <label className="adm-field">
            <span>Badge</span>
            <select value={form.badge} onChange={set('badge')}>
              <option value="">None</option>
              <option value="featured">On featured</option>
              <option value="copy">Copy icon</option>
            </select>
          </label>
        </div>
        {field('image', 'Image URL', { type: 'url' })}
        <label className="adm-field">
          <span>Description</span>
          <textarea rows={3} value={form.description} onChange={set('description')} />
        </label>
        <label className="adm-check">
          <input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Show in the shop
        </label>

        {isNew && (
          <>
            <h2>Colours</h2>
            {colors.map((c, i) => (
              <div key={i} className="adm-color-row">
                <input type="color" value={c.hex} onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} aria-label="Colour" />
                <input placeholder="Colour name, e.g. Navy" value={c.name} onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                {colors.length > 1 && (
                  <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setColors((cs) => cs.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setColors((cs) => [...cs, { name: '', hex: '#7d9066' }])}>
              + Add colour
            </button>

            <h2>Sizes</h2>
            <div className="adm-sizes">
              {ALL_SIZES.map((s) => (
                <label key={s} className="adm-check">
                  <input type="checkbox" checked={sizes.includes(s)} onChange={(e) => setSizes((cur) => (e.target.checked ? ALL_SIZES.filter((x) => x === s || cur.includes(x)) : cur.filter((x) => x !== s)))} />
                  {s}
                </label>
              ))}
            </div>
            <p className="adm-muted">A variant (stock 0) is created for every colour × size. Set the stock after saving.</p>
          </>
        )}

        {message && <p className={Object.keys(errors).length ? 'adm-error' : 'adm-ok'}>{message}</p>}
        <button type="submit" className="adm-btn adm-btn--dark" disabled={busy}>
          {busy ? 'Saving…' : isNew ? 'Create product' : 'Save details'}
        </button>
      </form>

      {!isNew &&
        product.colors.map((color) => (
          <section key={color.id} className="adm-card">
            <h2 className="adm-color-title">
              <span className="adm-swatch" style={{ background: color.hex }} /> {color.name}
              {color.image && <img src={color.image} alt="" className="adm-color-img" />}
            </h2>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Variant SKU</th>
                  <th>Stock</th>
                  <th>Min. stock</th>
                  <th>Level</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {color.variants.map((v) => (
                  <VariantRow key={v.id} variant={v} />
                ))}
              </tbody>
            </table>
          </section>
        ))}
    </>
  );
}
