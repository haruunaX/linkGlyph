import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";

const MINT = [94, 230, 168];
const SLATE = [148, 163, 184];

/**
 * A field of tiny QR-style squares. Squares near the pointer grow and turn mint;
 * a tap sends out a ripple; a slow wave runs through the field when idle.
 * Purely decorative: it sits behind content and ignores pointer hits.
 */
export function GlyphField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let gap = 24;
    let cols = 0;
    let rows = 0;
    let sizes = new Float32Array(0);
    let heat = new Float32Array(0);
    const pointer = { x: -9999, y: -9999, active: false };
    const ripples: Array<{ x: number; y: number; t: number }> = [];
    let frame = 0;
    let visible = true;
    let start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      gap = width < 640 ? 20 : 26;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / gap) + 1;
      rows = Math.ceil(height / gap) + 1;
      sizes = new Float32Array(cols * rows).fill(2);
      heat = new Float32Array(cols * rows);
      if (reduced) draw(performance.now());
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      const radius = width < 640 ? 110 : 160;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = c * gap + gap / 2;
          const y = r * gap + gap / 2;

          let target = 2 + (reduced ? 0 : (Math.sin(t * 1.1 + c * 0.35 + r * 0.22) + 1) * 0.9);
          let warm = 0;
          if (pointer.active) {
            const d = Math.hypot(x - pointer.x, y - pointer.y);
            if (d < radius) {
              const k = 1 - d / radius;
              warm = Math.max(warm, k);
              target += k * k * (gap * 0.55);
            }
          }
          for (const ripple of ripples) {
            const age = (now - ripple.t) / 1000;
            const ring = age * 520;
            const d = Math.hypot(x - ripple.x, y - ripple.y);
            const k = Math.max(0, 1 - Math.abs(d - ring) / 50) * Math.max(0, 1 - age / 1.2);
            warm = Math.max(warm, k);
            target += k * gap * 0.4;
          }

          sizes[i] += (target - sizes[i]) * (reduced ? 1 : 0.16);
          heat[i] += (warm - heat[i]) * (reduced ? 1 : 0.12);
          const h = heat[i];
          const rgb = SLATE.map((v, j) => Math.round(v + (MINT[j] - v) * h));
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.35 + h * 0.6})`;
          const s = sizes[i];
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      while (ripples.length && now - ripples[0].t > 1200) ripples.shift();
    };

    const loop = (now: number) => {
      if (visible) draw(now);
      frame = requestAnimationFrame(loop);
    };

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top, inside: clientY >= rect.top && clientY <= rect.bottom };
    };
    const onMove = (event: PointerEvent) => {
      const p = toLocal(event.clientX, event.clientY);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = p.inside && event.pointerType !== "touch";
    };
    const onDown = (event: PointerEvent) => {
      const p = toLocal(event.clientX, event.clientY);
      if (p.inside) ripples.push({ x: p.x, y: p.y, t: performance.now() });
    };
    const onLeave = () => (pointer.active = false);

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (reduced) return () => observer.disconnect();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    start = performance.now();
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none block h-full w-full ${className}`} />;
}
