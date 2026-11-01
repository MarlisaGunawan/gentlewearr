import { Bell, ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { apiEnabled } from '../services/api';
import { AdminAuthProvider, useAdmin } from './AdminAuth';
import Avatar from './components/Avatar';
import { NAV, titleFor } from './nav';
import AccountPage from './pages/AccountPage';
import CustomersPage from './pages/CustomersPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import LoginPage from './pages/LoginPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import ProductEditPage from './pages/ProductEditPage';
import ProductsPage from './pages/ProductsPage';
import WebsiteSectionPage from './pages/WebsiteSectionPage';
import '../styles/admin.css';

const COLLAPSE_KEY = 'gw-admin-collapsed';

/** Left navigation: grouped items, collapsible to an icon rail. */
function Sidebar({ collapsed, onToggle, onNavigate, counts, user, onLogout, mobile }) {
  return (
    <>
      <div className="adm-side__top">
        <Link to="/admin" className="adm-brand" onClick={onNavigate} title="Gentle Wear Backoffice">
          <span className="adm-logo" aria-hidden="true" />
          {!collapsed && (
            <span className="adm-brand__text">
              Gentle Wear
              <em>Backoffice · ERP & CMS</em>
            </span>
          )}
        </Link>
        {mobile && (
          <button type="button" className="adm-icon-btn" onClick={onNavigate} aria-label="Close menu">
            <X size={17} />
          </button>
        )}
      </div>

      <nav className="adm-nav" aria-label="Backoffice">
        {NAV.map((group, gi) => (
          <div key={group.label ?? gi} className="adm-nav__group">
            {group.label &&
              (collapsed ? <span className="adm-nav__rule" aria-hidden="true" /> : <h2 className="adm-nav__label">{group.label}</h2>)}
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const badge = item.badge ? counts[item.badge] : null;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) => 'adm-nav__item' + (isActive ? ' is-active' : '')}
                    >
                      <Icon size={17} aria-hidden="true" />
                      {collapsed ? <span className="visually-hidden">{item.label}</span> : <span className="adm-nav__text">{item.label}</span>}
                      {badge > 0 && (collapsed ? <span className="adm-nav__dot" aria-hidden="true" /> : <span className="adm-nav__badge">{badge}</span>)}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="adm-side__foot">
        {user && (
          <div className="adm-user" title={collapsed ? user.name : undefined}>
            <Avatar name={user.name} size={30} />
            {!collapsed && (
              <span className="adm-user__text">
                {user.name}
                <em>{user.email}</em>
              </span>
            )}
          </div>
        )}
        <div className="adm-side__actions">
          <button type="button" className="adm-icon-btn" onClick={onLogout} aria-label="Sign out" title="Sign out">
            <LogOut size={16} />
          </button>
          {!mobile && (
            <button
              type="button"
              className="adm-icon-btn"
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Shell() {
  const { token, user, setUser, logout, request } = useAdmin();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [drawer, setDrawer] = useState(false);
  const [counts, setCounts] = useState({ waiting: 0, low: 0 });
  const [query, setQuery] = useState('');

  // Who is signed in (also checks that a saved token is still valid).
  useEffect(() => {
    if (token && !user) request('/me').then(setUser).catch(() => {});
  }, [token, user, request, setUser]);

  // Badge numbers for the menu and the bell.
  useEffect(() => {
    if (!token) return;
    request('/dashboard?range=7d')
      .then((d) => setCounts({ waiting: d.waiting_payment, low: d.low_stock.length }))
      .catch(() => {});
  }, [token, request, pathname]);

  useEffect(() => setDrawer(false), [pathname]);

  if (!token) return <LoginPage />;

  const toggle = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1');
      } catch {
        // ignore
      }
      return !value;
    });
  };

  const search = (event) => {
    event.preventDefault();
    if (query.trim()) navigate('/admin/orders?search=' + encodeURIComponent(query.trim()));
  };

  const sidebar = (mobile) => (
    <Sidebar
      collapsed={!mobile && collapsed}
      mobile={mobile}
      onToggle={toggle}
      onNavigate={() => setDrawer(false)}
      counts={counts}
      user={user}
      onLogout={logout}
    />
  );

  return (
    <div className={'adm' + (collapsed ? ' is-collapsed' : '')}>
      <aside className="adm-side" aria-label="Primary">
        {sidebar(false)}
      </aside>

      <div className={'adm-drawer' + (drawer ? ' is-open' : '')} aria-hidden={!drawer}>
        <div className="adm-drawer__backdrop" onClick={() => setDrawer(false)} />
        <aside className="adm-drawer__panel" aria-label="Primary">
          {sidebar(true)}
        </aside>
      </div>

      <div className="adm-body">
        <header className="adm-top">
          <button type="button" className="adm-icon-btn adm-top__menu" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <nav aria-label="Breadcrumb" className="adm-crumbs">
            <span>Gentle Wear</span>
            <span aria-hidden="true">/</span>
            <strong aria-current="page">{titleFor(pathname)}</strong>
          </nav>

          <form className="adm-search" onSubmit={search} role="search">
            <Search size={15} aria-hidden="true" />
            <input type="search" placeholder="Search orders…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search orders" />
          </form>

          <Link to="/admin/inventory?filter=low" className="adm-icon-btn adm-bell" aria-label={counts.low + ' variants low on stock'} title="Low stock">
            <Bell size={17} />
            {counts.low > 0 && <span className="adm-bell__dot" aria-hidden="true" />}
          </Link>
          <a href="/" target="_blank" rel="noreferrer" className="adm-btn adm-btn--ghost adm-top__store">
            <ExternalLink size={15} aria-hidden="true" /> View store
          </a>
        </header>

        <main className="adm-main">
          {/* keyed by path so each page plays its entrance animation */}
          <div key={pathname} className="adm-page">
            <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:sku" element={<ProductEditPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:code" element={<OrderDetailPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="website/:section" element={<WebsiteSectionPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

/** /admin/* — the ERP + CMS backoffice. Needs the Laravel API. */
export default function AdminApp() {
  if (!apiEnabled) {
    return (
      <main className="adm-login adm-login--simple">
        <div className="adm-login__card">
          <h1>Backend not connected</h1>
          <p>Set VITE_API_URL in frontend/.env.local (e.g. http://localhost:8000/api) and restart the dev server.</p>
        </div>
      </main>
    );
  }

  return (
    <AdminAuthProvider>
      <Shell />
    </AdminAuthProvider>
  );
}
