import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Logo from "./Logo.jsx";
import { useShop } from "../lib/shop.jsx";
import { scrollToId } from "../App.jsx";
import { ease } from "./motion.jsx";

const LINKS = [
  ["Philosophy", "philosophy"],
  ["Collection", "collection"],
  ["Details", "details"],
  ["Limited", "limited"],
  ["Pre-book", "prebook"],
];

export default function Nav() {
  const { count, setCartOpen, phase } = useShop();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(v > prev && v > 400 && !menu);
    setSolid(v > 60);
  });
  useEffect(() => setMenu(false), [location.pathname]);

  const go = (id) => {
    setMenu(false);
    if (location.pathname !== "/") navigate(`/#${id}`);
    else scrollToId(id);
  };

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ${solid ? "bg-night/70 backdrop-blur-xl" : ""}`}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 sm:px-10">
          <button className="flex items-center gap-3 lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">
            <span className="flex w-7 flex-col gap-[6px]">
              <span className={`h-px bg-ivory transition-transform duration-500 ${menu ? "translate-y-[3.5px] rotate-45" : ""}`} />
              <span className={`h-px bg-ivory transition-transform duration-500 ${menu ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
            </span>
          </button>
          <nav className="hidden gap-9 lg:flex">
            {LINKS.slice(0, 3).map(([label, id]) => (
              <NavLink key={id} onClick={() => go(id)}>
                {label}
              </NavLink>
            ))}
          </nav>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2" aria-label="RUBIIK home">
            <Logo />
          </Link>
          <div className="flex items-center gap-9">
            <nav className="hidden gap-9 lg:flex">
              {LINKS.slice(3).map(([label, id]) => (
                <NavLink key={id} onClick={() => go(id)}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <button onClick={() => setCartOpen(true)} className="group relative flex items-center gap-2" aria-label="Open selection">
              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-ivory transition-colors group-hover:stroke-gold" fill="none" strokeWidth="1.2">
                <path d="M5 8h14l-1.2 12H6.2z M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="bg-gold absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-medium text-night"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
        {phase === "teaser" && !solid && (
          <div className="hairline mx-auto w-1/2 opacity-50" />
        )}
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-center gap-6 bg-night-900 px-8"
            initial={{ clipPath: "circle(0% at 24px 32px)" }}
            animate={{ clipPath: "circle(150% at 24px 32px)" }}
            exit={{ clipPath: "circle(0% at 24px 32px)" }}
            transition={{ duration: 0.9, ease }}
          >
            {LINKS.map(([label, id], i) => (
              <motion.button
                key={id}
                onClick={() => go(id)}
                className="text-left font-serif text-5xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.07, duration: 0.8, ease } }}
              >
                {label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ children, onClick }) {
  return (
    <button onClick={onClick} className="group relative font-sans text-[11px] uppercase tracking-wide2 text-ivory/80 transition-colors hover:text-ivory">
      {children}
      <span className="bg-gold absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 transition-transform duration-500 ease-lux group-hover:origin-left group-hover:scale-x-100" />
    </button>
  );
}
