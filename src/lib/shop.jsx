// Cart, launch phase and live stock, shared across the app.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS, LAUNCH, findProduct, phaseAt, unitPrice, totalsFor } from "../data/catalog.js";
import { addToCart } from "./pixel.js";

const ShopContext = createContext(null);
const CART_KEY = "rubiik.cart";
export const MAX_PER_MODEL = 2;

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return raw.filter((l) => findProduct(l.slug) && l.qty >= 1).map((l) => ({ slug: l.slug, qty: Math.min(MAX_PER_MODEL, l.qty) }));
  } catch {
    return [];
  }
}

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [status, setStatus] = useState(() => ({
    phase: phaseAt(),
    launch: LAUNCH,
    // Only availability is public; exact counts are shown in the admin dashboard alone.
    stock: { byModel: Object.fromEntries(PRODUCTS.map((p) => [p.slug, { available: true }])) },
    loaded: false,
  }));

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) setStatus({ ...(await res.json()), loaded: true });
    } catch {
      // API offline: keep the client-side phase so the site still renders.
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const t = setInterval(refreshStatus, 30000);
    return () => clearInterval(t);
  }, [refreshStatus]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable */
    }
  }, [cart]);

  const add = useCallback((slug, qty = 1) => {
    addToCart(slug, qty, status.phase);
    setCart((c) => {
      const line = c.find((l) => l.slug === slug);
      if (line) return c.map((l) => (l.slug === slug ? { ...l, qty: Math.min(MAX_PER_MODEL, l.qty + qty) } : l));
      return [...c, { slug, qty: Math.min(MAX_PER_MODEL, qty) }];
    });
    setCartOpen(true);
  }, [status.phase]);
  const setQty = useCallback((slug, qty) => {
    setCart((c) => (qty <= 0 ? c.filter((l) => l.slug !== slug) : c.map((l) => (l.slug === slug ? { ...l, qty: Math.min(MAX_PER_MODEL, qty) } : l))));
  }, []);
  const clear = useCallback(() => setCart([]), []);

  const value = useMemo(() => {
    const lines = cart.map((l) => {
      const product = findProduct(l.slug);
      return { ...l, product, unit: unitPrice(product, status.phase), compareAt: product.price };
    });
    const totals = totalsFor(lines.map((l) => ({ unit: l.unit, list: l.compareAt, qty: l.qty })));
    return {
      status,
      phase: status.phase,
      refreshStatus,
      cart: lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      // All amounts include GST: total (= subtotal) is what the customer pays; gst is the tax inside it.
      subtotal: totals.subtotal,
      compareTotal: totals.listTotal,
      gst: totals.gst,
      total: totals.total,
      add,
      setQty,
      clear,
      cartOpen,
      setCartOpen,
    };
  }, [cart, status, refreshStatus, add, setQty, clear, cartOpen]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
