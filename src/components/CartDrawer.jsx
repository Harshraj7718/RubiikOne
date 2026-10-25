import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useShop, MAX_PER_MODEL } from "../lib/shop.jsx";
import { formatINR, LAUNCH } from "../data/catalog.js";
import { ease } from "./motion.jsx";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, subtotal, compareTotal, gst, total, phase } = useShop();
  const saving = compareTotal - subtotal;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-night-900/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-md flex-col border-l border-ivory/10 bg-night-800"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.8, ease }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-ivory/10 px-7 py-6">
              <span className="eyebrow text-ivory">Your selection</span>
              <button onClick={() => setCartOpen(false)} className="eyebrow hover:text-gold">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6">
              {cart.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="font-serif text-3xl italic">Your time awaits.</p>
                  <p className="text-sm text-ivory-dim">Only 200 RUBIIK ONE will ever be made, across both models.</p>
                </div>
              )}
              {cart.map((l, i) => (
                <motion.div
                  key={l.slug}
                  className="flex gap-5 border-b border-ivory/10 py-5"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.08, duration: 0.7, ease } }}
                >
                  <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded bg-night-700">
                    <img src={l.product.images.cutout} alt="" className="h-24 object-contain" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-serif text-xl">{l.product.name}</span>
                    <span className="eyebrow mt-1">{l.product.edition}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 border border-gold/30 px-3 py-1">
                        <button onClick={() => setQty(l.slug, l.qty - 1)} className="px-1 hover:text-gold" aria-label="Decrease">
                          −
                        </button>
                        <span className="w-4 text-center text-sm tabular-nums">{l.qty}</span>
                        <button
                          onClick={() => setQty(l.slug, l.qty + 1)}
                          disabled={l.qty >= MAX_PER_MODEL}
                          className="px-1 hover:text-gold disabled:opacity-30"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        {l.unit !== l.compareAt && <div className="text-xs text-ivory-mute line-through">{formatINR(l.compareAt * l.qty)}</div>}
                        <div className="text-sm">{formatINR(l.unit * l.qty)}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-ivory/10 px-7 py-6">
                {saving > 0 && (
                  <div className="mb-3 flex justify-between text-sm text-gold-light">
                    <span>Pre-booking privilege (20%)</span>
                    <span>− {formatINR(saving)}</span>
                  </div>
                )}
                <div className="mb-3 flex justify-between text-sm text-ivory-dim">
                  <span>GST ({Math.round(LAUNCH.gstRate * 100)}%)</span>
                  <span>{formatINR(gst)}</span>
                </div>
                <div className="mb-6 flex items-baseline justify-between">
                  <span className="eyebrow text-ivory">Total</span>
                  <span className="font-serif text-3xl">{formatINR(total)}</span>
                </div>
                {phase === "teaser" ? (
                  <p className="text-center text-sm text-ivory-dim">
                    Pre-booking opens on{" "}
                    {new Date(LAUNCH.prebookOpens).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}. Your selection will be waiting.
                  </p>
                ) : (
                  <Link to="/checkout" onClick={() => setCartOpen(false)} className="btn-gold w-full">
                    {phase === "prebook" ? "Reserve now" : "Checkout"}
                  </Link>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
