import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";

const words = ["Restaurant menus", "Guest Wi-Fi", "Event tickets", "Business cards", "Product packaging", "Posters", "Portfolios", "Contact sheets"];

function Sparkle() {
  return (
    <span className="mx-6 inline-grid h-6 w-6 shrink-0 grid-cols-3 gap-[2px] sm:mx-10 sm:h-8 sm:w-8" aria-hidden="true">
      {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
        <i key={i} className={`rounded-[1px] ${on ? "bg-mint" : ""}`} />
      ))}
    </span>
  );
}

/** A big moving band of use cases. It drifts on its own and speeds up while you scroll. */
export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;
    let x = 0;
    let boost = 0;
    let lastY = window.scrollY;
    let frame = 0;
    let visible = true;

    const onScroll = () => {
      const y = window.scrollY;
      boost = Math.min(30, boost + Math.abs(y - lastY) * 0.25);
      lastY = y;
    };
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(track);

    const loop = () => {
      if (visible) {
        const half = track.scrollWidth / 2;
        x -= 0.6 + boost;
        if (half > 0 && -x >= half) x += half;
        track.style.transform = `translate3d(${x}px,0,0)`;
      }
      boost *= 0.92;
      frame = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const row = words.map((w, i) => (
    <span key={i} className="inline-flex items-center">
      <span className={i % 2 ? "text-white/90" : "text-mint"}>{w}</span>
      <Sparkle />
    </span>
  ));

  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-5 sm:py-7" aria-label={`Made for ${words.join(", ")}`}>
      <div ref={trackRef} className="flex w-max whitespace-nowrap text-3xl font-semibold tracking-tight will-change-transform sm:text-5xl lg:text-6xl" aria-hidden="true">
        {row}
        {row}
      </div>
    </div>
  );
}
