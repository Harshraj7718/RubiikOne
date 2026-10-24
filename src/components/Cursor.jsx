// Gold ring cursor that grows over links and shows a label over elements with data-cursor="label".
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });
  const [state, setState] = useState({ hover: false, label: "" });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setEnabled(fine);
    if (!fine) return;
    document.body.classList.add("has-cursor");
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target.closest?.("[data-cursor], a, button, input, textarea, select, label");
      const label = t?.getAttribute?.("data-cursor") ?? "";
      setState((s) => (s.hover === !!t && s.label === label ? s : { hover: !!t, label }));
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      document.body.classList.remove("has-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;
  const size = state.label ? 96 : state.hover ? 54 : 14;
  return (
    <>
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[200] h-1 w-1 rounded-full bg-gold" style={{ x, y, translateX: "-50%", translateY: "-50%" }} />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[199] flex items-center justify-center rounded-full border border-gold/70 mix-blend-difference"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: size, height: size, backgroundColor: state.label ? "rgba(201,164,100,0.9)" : "rgba(201,164,100,0)" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {state.label && <span className="font-sans text-[10px] uppercase tracking-wide2 text-night">{state.label}</span>}
      </motion.div>
    </>
  );
}
