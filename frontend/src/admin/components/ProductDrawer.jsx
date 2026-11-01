import { ChevronDown, Eye, Pencil, TrendingUp, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { categorySlug } from '../../config/catalog';
import { useAdmin } from '../AdminAuth';
import { rupiah } from './chart';

const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL'];

/** Collapsible section ("Product details", "Features", …). */
function Fold({ title, open: startOpen = false, children }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className={'adm-fold' + (open ? ' is-open' : '')}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {title} <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="adm-fold__body">{children}</div>}
    </div>
  );
}

/**
 * Right-hand panel with everything about one product: photos per colour,
 * sold / remaining, sizes and colours with their stock, details and features.
 */
export default function ProductDrawer({ sku, onClose }) {
  const { request } = useAdmin();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(null);
  const [photo, setPhoto] = useState(0);
  const [moreText, setMoreText] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!sku) return;
    setProduct(null);
    setError('');
    setColorIndex(0);
    setPhoto(0);
    setSize(null);
    request('/products/' + sku)
      .then(setProduct)
      .catch((e) => setError(e.message));
  }, [sku, request]);

  // Escape closes; focus moves into the panel when it opens.
  useEffect(() => {
    if (!sku) return undefined;
    panelRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sku, onClose]);

  // One photo per colour (recoloured photo, or the main photo for the first colour).
  const photos = useMemo(() => {
    if (!product) return [];
    const list = product.colors.map((c) => ({ src: c.image ?? product.image, label: c.name }));
    return list.filter((p, i) => list.findIndex((q) => q.src === p.src) === i);
  }, [product]);

  const color = product?.colors[colorIndex];
  const variants = color ? [...color.variants].sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)) : [];
  const chosen = variants.find((v) => v.size === size) ?? null;
  const open = Boolean(sku);

  const chooseColor = (i) => {
    setColorIndex(i);
    const p = photos.findIndex((x) => x.src === (product.colors[i].image ?? product.image));
    if (p >= 0) setPhoto(p);
  };

  return (
    <div className={'adm-sheet' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="adm-sheet__backdrop" onClick={onClose} />
      <aside ref={panelRef} className="adm-sheet__panel" role="dialog" aria-modal="true" aria-label="Product detail" tabIndex={-1}>
        <div className="adm-sheet__head">
          <h2>Product Detail</h2>
          <button type="button" className="adm-icon-btn adm-icon-btn--round" onClick={onClose} aria-label="Close product detail">
            <X size={18} />
          </button>
        </div>

        {error && <p className="adm-error">{error}</p>}
        {!product && !error && open && <p className="adm-muted adm-sheet__pad">Loading product…</p>}

        {product && (
          <div className="adm-sheet__body">
            <div className="adm-gallery">
              <div className="adm-gallery__main">
                <img src={photos[photo]?.src} alt={product.name} />
              </div>
              <div className="adm-gallery__thumbs">
                {photos.map((p, i) => (
                  <button key={p.src} type="button" className={i === photo ? 'is-active' : undefined} onClick={() => setPhoto(i)} aria-label={'Show ' + p.label}>
                    <img src={p.src} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="adm-pd__title">
              <h3>{product.name}</h3>
              <strong>{rupiah(product.price)}</strong>
            </div>
            <p className="adm-muted adm-pd__meta">
              {product.code} · {product.category} {product.line ? '· ' + product.line : ''}
            </p>

            <div className="adm-pd__stats">
              <span className="adm-stat">
                {product.sold.toLocaleString('id-ID')} Sold
                {product.sold > 0 && (
                  <em className="adm-up">
                    <TrendingUp size={12} aria-hidden="true" /> paid orders
                  </em>
                )}
              </span>
              <span className="adm-stat">{product.remaining.toLocaleString('id-ID')} Remaining</span>
              <span className={'badge ' + (product.is_active ? 'badge--good' : 'badge--muted')}>{product.is_active ? 'Active' : 'Hidden'}</span>
            </div>

            <div className="adm-pd__pick">
              <div>
                <h4>Size</h4>
                <div className="adm-sizepills">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={(v.size === size ? 'is-active ' : '') + (v.stock === 0 ? 'is-out' : '')}
                      onClick={() => setSize(v.size === size ? null : v.size)}
                      title={v.stock + ' in stock'}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4>Color</h4>
                <div className="adm-colors">
                  {product.colors.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      className={i === colorIndex ? 'is-active' : undefined}
                      style={{ '--swatch': c.hex }}
                      onClick={() => chooseColor(i)}
                      aria-label={c.name}
                      aria-pressed={i === colorIndex}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="adm-pd__stock">
              {color.name}
              {chosen ? ` · ${chosen.size}: ${chosen.stock} in stock (min ${chosen.min_stock})` : ` · ${variants.reduce((s, v) => s + v.stock, 0)} in stock across sizes`}
            </p>

            <h4 className="adm-pd__h">Descriptions</h4>
            <p className={'adm-pd__desc' + (moreText ? ' is-open' : '')}>
              {product.description || 'No description yet.'}{' '}
              {product.description?.length > 90 && (
                <button type="button" className="adm-link" onClick={() => setMoreText((m) => !m)}>
                  {moreText ? 'See less' : 'See more'}
                </button>
              )}
            </p>

            <Fold title="Product Details" open>
              <ul className="adm-pd__specs">
                <li>SKU: {product.sku}</li>
                <li>Style code: {product.code}</li>
                <li>Category: {product.category}</li>
                <li>Gender: Men</li>
                <li>Colours: {product.colors.map((c) => c.name).join(', ')}</li>
                <li>Sizes: {SIZE_ORDER.filter((s) => product.colors.some((c) => c.variants.some((v) => v.size === s))).join(', ')}</li>
              </ul>
            </Fold>
            <Fold title="Features">
              {product.hotspots?.length ? (
                <ul className="adm-pd__specs">
                  {product.hotspots.map((h) => (
                    <li key={h.title}>
                      <strong>{h.title}</strong> — {h.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="adm-muted">No feature notes yet.</p>
              )}
            </Fold>
            <Fold title="Stock by variant">
              <table className="adm-table adm-table--tight">
                <thead>
                  <tr>
                    <th>Colour</th>
                    {SIZE_ORDER.map((s) => (
                      <th key={s} className="adm-right">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.colors.map((c) => (
                    <tr key={c.id}>
                      <th scope="row">
                        <span className="adm-dot" style={{ background: c.hex }} /> {c.name}
                      </th>
                      {SIZE_ORDER.map((s) => {
                        const v = c.variants.find((x) => x.size === s);
                        return (
                          <td key={s} className={'adm-right adm-mono' + (v && v.stock <= v.min_stock ? ' adm-warn' : '')}>
                            {v ? v.stock : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Fold>
          </div>
        )}

        {product && (
          <div className="adm-sheet__foot">
            <a className="adm-btn adm-btn--ghost" href={'/shop/' + categorySlug(product.category) + '?product=' + product.sku} target="_blank" rel="noreferrer">
              <Eye size={16} aria-hidden="true" /> Customer View
            </a>
            <Link className="adm-btn adm-btn--soft" to={'/admin/products/' + product.sku}>
              <Pencil size={16} aria-hidden="true" /> Edit Product
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
