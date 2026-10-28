import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import Loader from "./components/Loader.jsx";
import Cursor from "./components/Cursor.jsx";
import Nav from "./components/Nav.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";

// Everything except the home page is loaded on demand, so the first visit downloads only what it shows.
const Product = lazy(() => import("./pages/Product.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Account = lazy(() => import("./pages/Account.jsx"));
const AdminApp = lazy(() => import("./pages/admin/AdminApp.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const PageFallback = () => <div className="min-h-screen bg-night" />;
import { useShop } from "./lib/shop.jsx";

let lenis;
export const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -40, duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth" });
};

export const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: "smooth" }));

export const scrollTop = () => (lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0));

export default function App() {
  const location = useLocation();
  const { cartOpen } = useShop();
  const [loaded, setLoaded] = useState(() => sessionStorageGet("rubiik.loaded") === "1");

  // Lenis gives the page its weighted, inertial scroll feel.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenis = undefined;
    };
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (cartOpen || !loaded) lenis.stop();
    else lenis.start();
  }, [cartOpen, loaded]);

  useEffect(() => {
    if (location.hash) setTimeout(() => scrollToId(location.hash.slice(1)), 400);
    else if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  // The admin dashboard has its own layout: no site loader, menu bar, cart or footer.
  if (location.pathname.startsWith("/admin"))
    return (
      <>
        <Cursor />
        {/* Mounted under /admin/* so the dashboard's own routes resolve relative to /admin. */}
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </Suspense>
      </>
    );

  return (
    <>
      <AnimatePresence>
        {!loaded && (
          <Loader
            onDone={() => {
              sessionStorageSet("rubiik.loaded", "1");
              setLoaded(true);
            }}
          />
        )}
      </AnimatePresence>
      <Cursor />
      <Nav />
      <CartDrawer />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8 } }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          <Suspense fallback={<PageFallback />}>
            <Routes location={location}>
              <Route path="/" element={<Home ready={loaded} />} />
              <Route path="/watch/:slug" element={<Product />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/account" element={<Account />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Home ready={loaded} />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}

function sessionStorageGet(k) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function sessionStorageSet(k, v) {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}
