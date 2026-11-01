import { useId, useState } from 'react';
import { avatar, navLinks } from '../../config/landingContent';
import SplitWords from '../common/SplitWords';
import Icon from './Icon';
import ProductCard from './ProductCard';

/**
 * Big coloured panel: navigation, headline, category pills and a product list
 * with search, an in-stock filter and collapsible extra groups.
 * `panel.tone` picks the colour: 'peach' or 'sage'.
 */
export default function CollectionPanel({ id, panel, showNav = false }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [openGroup, setOpenGroup] = useState(null);
  const listId = useId();

  const search = query.trim().toLowerCase();
  const visibleProducts = panel.products.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      (!inStockOnly || !p.soldOut) &&
      (search === '' || (p.name + ' ' + p.line).toLowerCase().includes(search))
  );

  return (
    <section id={id} className={'panel panel--' + panel.tone} data-parallax-scope data-reveal-scale>
      <div className="panel__backdrop" aria-hidden="true">
        <img
          src={panel.background}
          alt=""
          loading="lazy"
          style={{ objectPosition: panel.backgroundPosition }}
          data-parallax="8"
        />
      </div>

      {showNav && (
        <nav className="panel-nav" aria-label="Store" data-reveal-stagger>
          <a className="pill pill--light" href={navLinks[0].href}>
            <Icon name={navLinks[0].icon} size={12} />
            {navLinks[0].label}
          </a>
          <div className="pill-group">
            {navLinks.slice(1).map((link) => (
              <a key={link.label} href={link.href}>
                <Icon name={link.icon} size={12} />
                {link.label}
              </a>
            ))}
          </div>
          <img className="panel-nav__avatar" src={avatar} alt="Your account" />
        </nav>
      )}

      <header className="panel__intro">
        <h2 data-reveal-words>
          <SplitWords text={panel.title} />
        </h2>
        <p data-reveal>{panel.intro}</p>
      </header>

      <div className="panel__toolbar" data-reveal>
        <div className="panel__categories">
          <span className="pill pill--light">Product categories</span>
          <div className="pill-group" role="group" aria-label="Filter by category">
            {panel.categories.map((name) => (
              <button
                key={name}
                type="button"
                className={name === category ? 'is-active' : undefined}
                aria-pressed={name === category}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="panel__actions">
          <a className="pill pill--light" href="#">
            {panel.primaryAction}
          </a>
          <a className="pill pill--ghost" href="#">
            {panel.secondaryAction}
          </a>
        </div>
      </div>

      <div className="panel__sheet" data-reveal>
        <div className="sheet__head">
          <button
            type="button"
            className={'sheet__toggle' + (listOpen ? ' is-open' : '')}
            aria-expanded={listOpen}
            aria-controls={listId}
            onClick={() => setListOpen((open) => !open)}
          >
            {panel.listTitle}
            <Icon name="chevron" size={13} />
          </button>

          <div className="sheet__tools">
            <label className="search">
              <Icon name="search" size={13} />
              <input
                type="search"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={'Search ' + panel.listTitle.toLowerCase()}
              />
            </label>
            <button
              type="button"
              className={'filters' + (inStockOnly ? ' is-active' : '')}
              aria-pressed={inStockOnly}
              title="Show only items in stock"
              onClick={() => setInStockOnly((on) => !on)}
            >
              {inStockOnly ? 'In stock' : 'Filters'}
            </button>
          </div>
        </div>

        <div id={listId} hidden={!listOpen}>
          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="sheet__empty">No products match your search.</p>
          )}
        </div>

        <div className="sheet__groups">
          {panel.groups.map((group) => {
            const isOpen = openGroup === group.title;
            return (
              <div key={group.title} className="sheet__group">
                <button
                  type="button"
                  className={'sheet__group-toggle' + (isOpen ? ' is-open' : '')}
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroup(isOpen ? null : group.title)}
                >
                  {group.title}
                  <Icon name="chevron" size={12} />
                </button>
                {isOpen && (
                  <div className="product-grid">
                    {group.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
