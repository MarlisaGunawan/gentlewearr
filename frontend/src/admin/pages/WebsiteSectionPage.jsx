import { ArrowDown, ArrowUp, ExternalLink, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAdmin } from '../AdminAuth';
import { ClipsEditor, MediaField, NavLinksEditor } from '../components/CmsFields';
import { useAdminData } from '../useAdminData';

/**
 * CMS sections. `key` = the setting saved in Laravel, `anchor` = where it sits
 * on the website, `fields` = what can be edited.
 *   type: text | textarea | words (hero title) | products (SKU picker) | url
 *         | media (kind: image | video | icon) | links (navbar) | clips (hero videos)
 */
const SECTIONS = {
  seo: {
    key: 'site',
    title: 'Site & SEO',
    intro: 'Shop name, the title in the browser tab and Google, the search description, favicon and navbar logo.',
    anchor: '',
    preview: 'seo',
    fields: [
      { name: 'name', label: 'Shop name', type: 'text', max: 40 },
      { name: 'title', label: 'Browser tab / Google title', type: 'text', max: 70 },
      { name: 'description', label: 'Search description', type: 'textarea', max: 160, rows: 3 },
      { name: 'favicon', label: 'Favicon (square PNG or ICO)', type: 'media', kind: 'icon' },
      { name: 'logo', label: 'Navbar logo', type: 'media', kind: 'icon' },
    ],
  },
  navbar: {
    key: 'navbar',
    title: 'Navbar',
    intro: 'The menu at the top (also used in the footer): rename, hide or reorder the links.',
    anchor: '',
    fields: [{ name: 'links', label: 'Menu links', type: 'links' }],
  },
  hero: {
    key: 'hero',
    title: 'Hero',
    intro: 'The first screen: three title words that fade out over the video, and the short text under them.',
    anchor: '',
    fields: [
      { name: 'titleWords', label: 'Title words', type: 'words' },
      { name: 'description', label: 'Description', type: 'textarea', max: 300 },
      { name: 'controllerLabel', label: 'Button bar label', type: 'text', max: 30 },
      { name: 'poster', label: 'Poster image (shown while the videos load)', type: 'media', kind: 'image' },
      { name: 'controls', label: 'Hero videos', type: 'clips' },
    ],
  },
  collection: {
    key: 'featured',
    title: 'Collection',
    intro: 'The big featured panel: heading, intro and the products listed under “Featured clothing”.',
    anchor: '#collection',
    fields: [
      { name: 'title', label: 'Heading', type: 'text', max: 120 },
      { name: 'intro', label: 'Intro', type: 'textarea', max: 300 },
      { name: 'product_skus', label: 'Featured products', type: 'products', max: 12 },
      { name: 'background', label: 'Background photo', type: 'media', kind: 'image' },
    ],
  },
  essentials: {
    key: 'essentials',
    title: 'Essentials',
    intro: 'The row of product cards under the collection.',
    anchor: '#essentials',
    fields: [
      { name: 'title', label: 'Section name', type: 'text', max: 80 },
      { name: 'product_skus', label: 'Products in the row', type: 'products', max: 8 },
    ],
  },
  story: {
    key: 'editorial',
    title: 'Story',
    intro: 'The editorial / collaboration card.',
    anchor: '#story',
    fields: [
      { name: 'tag', label: 'Tag', type: 'text', max: 30 },
      { name: 'overlay', label: 'Text on the photo (Enter = new line)', type: 'textarea', max: 60, rows: 2 },
      { name: 'title', label: 'Title', type: 'text', max: 120 },
      { name: 'text', label: 'Text', type: 'textarea', max: 500 },
      { name: 'action', label: 'Button text', type: 'text', max: 40 },
      { name: 'image', label: 'Photo', type: 'media', kind: 'image' },
    ],
  },
  lookbook: {
    key: 'lookbook',
    title: 'Lookbook',
    intro: 'The lookbook banner and its slider of outfits.',
    anchor: '#lookbook',
    fields: [
      { name: 'eyebrow', label: 'Small label', type: 'text', max: 60 },
      { name: 'title', label: 'Title', type: 'text', max: 120 },
      { name: 'intro', label: 'Intro', type: 'textarea', max: 300 },
      { name: 'action', label: 'Button text', type: 'text', max: 40 },
      { name: 'background', label: 'Banner photo', type: 'media', kind: 'image' },
    ],
  },
  footer: {
    key: 'footer',
    title: 'Footer',
    intro: 'The closing section: heading, text, copyright line and social links.',
    anchor: '#contact',
    fields: [
      { name: 'title', label: 'Heading', type: 'text', max: 100 },
      { name: 'text', label: 'Text', type: 'textarea', max: 300 },
      { name: 'copyright', label: 'Copyright line', type: 'text', max: 100 },
      { name: 'instagram', label: 'Instagram link', type: 'url' },
      { name: 'tiktok', label: 'TikTok link', type: 'url' },
      { name: 'image', label: 'Background photo', type: 'media', kind: 'image' },
      { name: 'video', label: 'Background video (optional, plays over the photo)', type: 'media', kind: 'video' },
    ],
  },
};

/** Ordered product list with add / remove / move. */
function ProductPicker({ value, onChange, products, max }) {
  const [adding, setAdding] = useState('');
  const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));
  const available = products.filter((p) => !value.includes(p.sku));

  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className="adm-picker">
      <ol>
        {value.map((sku, i) => {
          const p = bySku[sku];
          return (
            <li key={sku}>
              <span className="adm-picker__n">{i + 1}</span>
              {p && <img src={p.image} alt="" />}
              <span className="adm-picker__name">
                {p ? p.name.split(' — ')[0] : sku}
                <em>{sku}</em>
              </span>
              <span className="adm-picker__tools">
                <button type="button" className="adm-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  <ArrowUp size={14} />
                </button>
                <button type="button" className="adm-icon-btn" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                  <ArrowDown size={14} />
                </button>
                <button type="button" className="adm-icon-btn" disabled={value.length <= 1} onClick={() => onChange(value.filter((s) => s !== sku))} aria-label={'Remove ' + sku}>
                  <X size={14} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      {value.length < max && (
        <div className="adm-picker__add">
          <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Product to add">
            <option value="">Choose a product…</option>
            {available.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.name.split(' — ')[0]} ({p.sku})
              </option>
            ))}
          </select>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={!adding} onClick={() => (onChange([...value, adding]), setAdding(''))}>
            <Plus size={14} aria-hidden="true" /> Add
          </button>
        </div>
      )}
      <small className="adm-muted">
        {value.length} of max {max}
      </small>
    </div>
  );
}

/** /admin/website/:section — edit one part of the landing page. */
export default function WebsiteSectionPage() {
  const { section } = useParams();
  const config = SECTIONS[section];
  const { request } = useAdmin();
  const { data, error } = useAdminData('/content');
  const needsProducts = config?.fields.some((f) => f.type === 'products');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && config) setForm(structuredClone(data[config.key] ?? {}));
    setErrors({});
    setMessage('');
  }, [data, config]);

  useEffect(() => {
    if (needsProducts && products.length === 0) request('/products').then((d) => setProducts(d.products)).catch(() => {});
  }, [needsProducts, products.length, request]);

  if (!config) return <Navigate to="/admin/website/hero" replace />;
  if (error) return <p className="adm-error">{error}</p>;

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage('');
    try {
      const saved = await request('/content', { method: 'PUT', body: { [config.key]: form } });
      setForm(structuredClone(saved[config.key]));
      setMessage('Saved ✓ — reload the website to see it.');
    } catch (e) {
      const prefix = config.key + '.';
      setErrors(Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, v]) => [k.startsWith(prefix) ? k.slice(prefix.length).split('.')[0] : k, v[0]])));
      setMessage(e.errors ? 'Please check the highlighted fields.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  const renderField = (f) => {
    const value = form[f.name];
    let control;
    if (f.type === 'words') {
      const words = value ?? [];
      control = (
        <div className="adm-words">
          {words.map((w, i) => (
            <input key={i} value={w} maxLength={20} aria-label={'Word ' + (i + 1)} onChange={(e) => set(f.name, words.map((x, j) => (j === i ? e.target.value : x)))} />
          ))}
        </div>
      );
    } else if (f.type === 'products') {
      control = <ProductPicker value={value ?? []} onChange={(v) => set(f.name, v)} products={products} max={f.max} />;
    } else if (f.type === 'media') {
      control = <MediaField kind={f.kind} value={value} onChange={(v) => set(f.name, v)} />;
    } else if (f.type === 'links') {
      control = <NavLinksEditor value={value ?? []} onChange={(v) => set(f.name, v)} />;
    } else if (f.type === 'clips') {
      control = <ClipsEditor value={value ?? []} onChange={(v) => set(f.name, v)} />;
    } else if (f.type === 'textarea') {
      control = <textarea rows={f.rows ?? 4} maxLength={f.max} value={value ?? ''} onChange={(e) => set(f.name, e.target.value)} />;
    } else {
      control = <input type={f.type === 'url' ? 'url' : 'text'} maxLength={f.max} value={value ?? ''} placeholder={f.type === 'url' ? 'https://' : undefined} onChange={(e) => set(f.name, e.target.value)} />;
    }
    const Wrap = ['text', 'textarea', 'url'].includes(f.type) ? 'label' : 'div';
    return (
      <Wrap key={f.name} className={'adm-field' + (errors[f.name] ? ' has-error' : '')}>
        <span>
          {f.label}
          {f.max && f.type !== 'products' && typeof value === 'string' && (
            <em className="adm-field__count">
              {value.length}/{f.max}
            </em>
          )}
        </span>
        {control}
        {errors[f.name] && <small>{errors[f.name]}</small>}
      </Wrap>
    );
  };

  return (
    <>
      <header className="adm-head">
        <div>
          <p className="adm-eyebrow">Website · CMS</p>
          <h1>{config.title}</h1>
          <p className="adm-muted">{config.intro}</p>
        </div>
        <a className="adm-btn adm-btn--ghost" href={'/' + config.anchor} target="_blank" rel="noreferrer">
          <ExternalLink size={15} aria-hidden="true" /> Preview on site
        </a>
      </header>

      {!form ? (
        <p className="adm-muted">Loading content…</p>
      ) : (
        <form className="adm-card adm-form adm-form--narrow" onSubmit={save}>
          {config.preview === 'seo' && (
            <div className="adm-serp" aria-label="Search result preview">
              <div className="adm-serp__site">
                <img src={form.favicon || '/favicon.svg'} alt="" />
                <span>
                  {form.name}
                  <em>{window.location.origin}</em>
                </span>
              </div>
              <p className="adm-serp__title">{form.title}</p>
              <p className="adm-serp__desc">{form.description}</p>
            </div>
          )}
          {config.fields.map(renderField)}
          <div className="adm-savebar">
            {message && <p className={message.startsWith('Saved') ? 'adm-ok' : 'adm-error'}>{message}</p>}
            <button type="submit" className="adm-btn adm-btn--dark" disabled={busy}>
              {busy ? 'Saving…' : 'Save ' + config.title.toLowerCase()}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
