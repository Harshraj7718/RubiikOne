// Lightweight canvas particles: gently rising dust.
// `tone` picks gold or white particles.
// Pauses when off screen and renders a still frame for reduced-motion visitors.
// Each particle is a pre-drawn glowing sprite: canvas shadowBlur per particle per frame is very slow.
import { useEffect, useRef } from "react";

// One soft glowing dot, drawn once per colour and stamped for every particle.
function makeSprite(core, glow) {
  const size = 32;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, core);
  grad.addColorStop(0.18, core);
  grad.addColorStop(0.32, glow);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

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
    const sprite = tone === "white" ? makeSprite("rgba(249,249,249,1)", "rgba(255,255,255,0.35)") : makeSprite("rgba(236,210,156,1)", "rgba(201,164,100,0.45)");

    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.4 + Math.random() * 1.6,
      vy: -(0.12 + Math.random() * 0.35),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.004 + Math.random() * 0.01,
      tw: Math.random() * Math.PI * 2,
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
        // The sprite's bright core is ~36% of its width, so it's drawn ~5.5× the particle radius.
        const d = p.r * 5.5;
        ctx.globalAlpha = Math.max(0, 0.35 + Math.sin(p.tw) * 0.3);
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
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
