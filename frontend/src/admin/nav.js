import {
  Boxes,
  Globe,
  Menu,
  CreditCard,
  GalleryHorizontalEnd,
  LayoutDashboard,
  LayoutGrid,
  Newspaper,
  Package,
  PackagePlus,
  PanelBottom,
  ShoppingBag,
  Shirt,
  Sparkles,
  UserCog,
  Users,
} from 'lucide-react';

/**
 * Backoffice menu. ERP (store + sales) and CMS (website) live side by side.
 * `match` = path prefix that marks the item active.
 */
export const NAV = [
  {
    items: [{ to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Store',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package, end: true },
      { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
      { to: '/admin/products/new', label: 'Add product', icon: PackagePlus },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: 'waiting' },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/admin/website/seo', label: 'Site & SEO', icon: Globe },
      { to: '/admin/website/navbar', label: 'Navbar', icon: Menu },
      { to: '/admin/website/hero', label: 'Hero', icon: Sparkles },
      { to: '/admin/website/collection', label: 'Collection', icon: LayoutGrid },
      { to: '/admin/website/essentials', label: 'Essentials', icon: Shirt },
      { to: '/admin/website/story', label: 'Story', icon: Newspaper },
      { to: '/admin/website/lookbook', label: 'Lookbook', icon: GalleryHorizontalEnd },
      { to: '/admin/website/footer', label: 'Footer', icon: PanelBottom },
    ],
  },
  {
    label: 'Settings',
    items: [{ to: '/admin/account', label: 'Account', icon: UserCog }],
  },
];

/** Page title for the breadcrumb, from the current path. */
export function titleFor(pathname) {
  if (/^\/admin\/products\/(?!new)[^/]+$/.test(pathname)) return 'Edit product';
  if (/^\/admin\/orders\/.+/.test(pathname)) return 'Order detail';
  const item = NAV.flatMap((g) => g.items)
    .filter((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return item?.label ?? 'Overview';
}
