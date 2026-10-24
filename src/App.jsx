import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import Loader from "./components/Loader.jsx";
import Cursor from "./components/Cursor.jsx";
import Nav from "./components/Nav.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Product from "./pages/Product.jsx";
import Checkout from "./pages/Checkout.jsx";
import Account from "./pages/Account.jsx";
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
          <Routes location={location}>
            <Route path="/" element={<Home ready={loaded} />} />
            <Route path="/watch/:slug" element={<Product />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Home ready={loaded} />} />
          </Routes>
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
