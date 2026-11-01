import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProduct, imageFor, nameFor, stockFor } from '../config/catalog';

const CartContext = createContext(null);
const STORAGE_KEY = 'gw-cart';

// One cart line = one variant (product + colour + size).
const lineKey = (productId, color, size) => productId + '|' + color + '|' + size;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter((line) => getProduct(line.productId)) : [];
  } catch {
    return []; // storage blocked or broken data → start empty
  }
}

/**
 * Shopping cart shared by the whole app. Saved in the browser so it survives a
 * reload. Quantities are capped by the variant's stock.
 */
export function CartProvider({ children }) {
  const [lines, setLines] = useState(loadCart);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore — the cart still works for this visit
    }
  }, [lines]);

  const add = useCallback(({ productId, color, size, qty = 1 }) => {
    const max = stockFor(getProduct(productId), color, size);
    const key = lineKey(productId, color, size);
    setLines((prev) => {
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) => (line.key === key ? { ...line, qty: Math.min(max, line.qty + qty) } : line));
      }
      return [...prev, { key, productId, color, size, qty: Math.min(max, qty) }];
    });
  }, []);

  const setQty = useCallback((key, qty) => {
    setLines((prev) =>
      prev
        .map((line) => {
          if (line.key !== key) return line;
          const max = stockFor(getProduct(line.productId), line.color, line.size);
          return { ...line, qty: Math.max(0, Math.min(max, qty)) };
        })
        .filter((line) => line.qty > 0)
    );
  }, []);

  const remove = useCallback((key) => setLines((prev) => prev.filter((line) => line.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    // Attach product info so components don't have to look it up.
    const items = lines.map((line) => {
      const product = getProduct(line.productId);
      // name and image follow the chosen colour
      return {
        ...line,
        product,
        name: nameFor(product, line.color),
        image: imageFor(product, line.color),
        lineTotal: product.price * line.qty,
      };
    });
    return {
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [lines, add, setQty, remove, clear, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
