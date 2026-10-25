// Lightweight canvas particles: gently rising dust.
// `tone` picks gold or white particles.
// Pauses when off screen and renders a still frame for reduced-motion visitors.
import { useEffect, useRef } from "react";

export default function Particles({ tone = "gold", density = 1, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let parts = [];
    let raf = 0;
    let visible = true;

    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.4 + Math.random() * 1.6,
      vy: -(0.12 + Math.random() * 0.35),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.004 + Math.random() * 0.01,
      tw: Math.random() * Math.PI * 2,
      gold: tone !== "white",
    });

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / 14000) * density);
      parts = Array.from({ length: Math.min(count, 180) }, () => spawn(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.sway += p.swaySpeed;
        p.tw += 0.03;
        p.y += p.vy;
        p.x += Math.sin(p.sway) * 0.25;
        if (p.y < -10) Object.assign(p, spawn(false));
        const alpha = 0.35 + Math.sin(p.tw) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(236,210,156,${alpha})` : `rgba(249,249,249,${alpha})`;
        ctx.shadowBlur = p.gold ? 6 : 3;
        ctx.shadowColor = p.gold ? "rgba(201,164,100,0.8)" : "rgba(255,255,255,0.6)";
        ctx.fill();
      }
    };

    const loop = () => {
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) draw();
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [tone, density]);

  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" />;
}
