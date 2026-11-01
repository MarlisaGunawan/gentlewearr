import { lazy, Suspense, useLayoutEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { setupScrollAnimations } from './animations/scrollAnimations';
import CartDrawer from './components/cart/CartDrawer';
import SiteFooter from './components/footer/SiteFooter';
import SiteNav from './components/nav/SiteNav';
import CategoryPage from './pages/CategoryPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage';

// The backoffice is only loaded when someone opens /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'));

/** The public shop: navbar, pages, footer and cart drawer. */
function Storefront() {
  const { pathname } = useLocation();

  // New page → start at the top (the home page handles its own section scrolling).
  useLayoutEffect(() => {
    if (pathname !== '/') window.scrollTo(0, 0);
  }, [pathname]);

  // Scroll animations (reveal + parallax) for whatever page is showing.
  useLayoutEffect(() => setupScrollAnimations(document.body), [pathname]);

  return (
    <>
      <SiteNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop/:category" element={<CategoryPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:orderId" element={<OrderPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }

  return <Storefront />;
}
