import { useEffect, useRef, useState } from "react";
import { ArrowDown, Download, Globe2, Layers3, LockKeyhole, Mail, MousePointerClick, Phone, Type, Wifi, Zap } from "lucide-react";
import { prefersReducedMotion } from "../lib/motion";
import { GlyphField } from "./GlyphField";
import { presets } from "./StylePanel";
import { container, tile } from "./ui";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
      </span>
      {children}
    </span>
  );
}

const SIZE = 9;
const isFinder = (r: number, c: number) => (r < 3 && c < 3) || (r < 3 && c >= SIZE - 3) || (r >= SIZE - 3 && c < 3);
const isFinderHole = (r: number, c: number) => isFinder(r, c) && r % (SIZE - 3) === 1 && c % (SIZE - 3) === 1;
const isSeparator = (r: number, c: number) => !isFinder(r, c) && ((r < 4 && c < 4) || (r < 4 && c >= SIZE - 4) || (r >= SIZE - 4 && c < 4));

function randomPattern(): boolean[] {
  return Array.from({ length: SIZE * SIZE }, (_, i) => {
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    if (isFinder(r, c)) return !isFinderHole(r, c);
    if (isSeparator(r, c)) return false;
    return Math.random() > 0.5;
  });
}

/** A tiny QR-like glyph that keeps regenerating in a diagonal wave, with a scan line sweeping over it. */
function LiveGlyph() {
  const [cells, setCells] = useState(randomPattern);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setCells(randomPattern()), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white p-2.5 sm:h-32 sm:w-32 sm:p-3" aria-hidden="true">
      <div className="grid h-full w-full gap-[2px]" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
        {cells.map((on, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          return (
            <span
              key={i}
              className="rounded-[1.5px] bg-ink transition-[transform,opacity] duration-300 ease-out"
              style={{ transform: on ? "scale(1)" : "scale(0.2)", opacity: on ? 1 : 0, transitionDelay: `${(r + c) * 28}ms` }}
            />
          );
        })}
      </div>
      <span className="absolute inset-x-1 top-0 h-[2px] animate-[scan_2.6s_ease-in-out_infinite] rounded-full bg-mint shadow-[0_0_12px_3px_rgba(94,230,168,.7)]" />
    </div>
  );
}

const delay = (ms: number) => ({ transitionDelay: `${ms}ms` });

export function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll-linked exit: the hero eases back and fades as you scroll past it.
  useEffect(() => {
    const el = contentRef.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, el.offsetHeight)));
      el.style.transform = `translate3d(0, ${(p * 70).toFixed(1)}px, 0) scale(${(1 - p * 0.05).toFixed(3)})`;
      el.style.opacity = String(1 - p * 0.55);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <GlyphField />
      </div>
      <div ref={contentRef} className={`${container} grid gap-3 pb-14 pt-10 will-change-transform sm:pb-20 sm:pt-16 lg:grid-cols-12 lg:items-center lg:gap-6 [&>*]:min-w-0`}>
        <div className="lg:col-span-7">
          <div data-reveal style={delay(0)}>
            <Eyebrow>Free, private, browser-based</Eyebrow>
          </div>
          <h1
            data-reveal
            style={delay(90)}
            className="mt-6 text-[38px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink min-[380px]:text-[44px] sm:text-6xl xl:text-[80px]"
          >
            Turn any link into a{" "}
            <span className="relative sm:whitespace-nowrap">
              <span className="relative z-10">beautiful signal.</span>
              <span className="absolute inset-x-0 bottom-1.5 h-3.5 origin-left animate-[underline_.9s_.55s_cubic-bezier(.2,.7,.2,1)_both] bg-mint/80 sm:bottom-2 sm:h-5" aria-hidden="true" />
            </span>
          </h1>
          <p data-reveal style={delay(180)} className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            Create polished QR codes for websites, Wi-Fi, messages, and contact details. Customize every detail, then export it in crisp formats.
          </p>
          <div data-reveal style={delay(270)} className="mt-8 flex flex-col items-start gap-4 sm:mt-10 sm:flex-row sm:items-center">
            <a
              href="#studio"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-ink px-6 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              Create a QR code
              <ArrowDown className="h-[18px] w-[18px] text-mint motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]" />
            </a>
            <span className="hidden items-center gap-2 text-base text-slate-500 sm:inline-flex">
              <MousePointerClick className="h-5 w-5 text-emerald-600" />
              Move your cursor around
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:col-span-5 lg:mt-0">
          <div data-reveal data-spotlight style={delay(150)} className="flex items-center justify-between gap-5 rounded-2xl bg-ink p-6 text-white sm:gap-8 sm:p-8">
            <div className="min-w-0">
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">Live preview</span>
              <strong className="mt-5 block text-2xl font-semibold tracking-tight sm:text-3xl">What you see is what you print</strong>
              <p className="mt-2 text-[15px] leading-6 text-slate-300">Every change renders instantly, and exports stay pixel-sharp.</p>
            </div>
            <LiveGlyph />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["5", "Content types"],
              ["2048", "Pixel export"],
              ["SVG", "Print ready"],
            ].map(([value, text], i) => (
              <div key={text} data-reveal data-spotlight style={delay(240 + i * 80)} className={`${tile} flex flex-col justify-between p-3.5 sm:p-6`}>
                <strong className="text-[22px] font-semibold tracking-tight text-ink sm:text-4xl">{value}</strong>
                <span className="mt-3 text-[13px] text-slate-500 sm:text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const types = [
  { icon: Globe2, label: "Link" },
  { icon: Type, label: "Text" },
  { icon: Mail, label: "Email" },
  { icon: Phone, label: "Phone" },
  { icon: Wifi, label: "Wi-Fi" },
];

function FeatureIcon({ icon: Icon }: { icon: typeof Layers3 }) {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-mint transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
      <Icon className="h-5 w-5" />
    </span>
  );
}

const featureTile = `${tile} group p-6 transition-colors duration-300 hover:border-ink/25 sm:p-9`;

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-slate-200/80 sm:scroll-mt-[72px]">
      <div className={`${container} py-16 sm:py-20 lg:py-28`}>
        <div className="max-w-3xl" data-reveal>
          <Eyebrow>Built for real life</Eyebrow>
          <h2 className="mt-4 text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-5xl">Confidence before the first scan</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            LinkGlyph keeps the creative freedom of a design tool and adds the practical touches needed for packaging, events, menus, and printed materials.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:mt-12 md:grid-cols-3">
          <article data-reveal data-spotlight style={delay(0)} className={`${featureTile} flex flex-col justify-between gap-10 md:col-span-2`}>
            <div>
              <FeatureIcon icon={Layers3} />
              <h3 className="mt-6 text-xl font-semibold text-ink sm:text-2xl">Designed, not default</h3>
              <p className="mt-3 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Curated palettes, flexible content types, and sharp exports make every code feel intentional.</p>
            </div>
            <div className="grid grid-cols-4 gap-2.5" aria-hidden="true">
              {presets.map((p, i) => (
                <div
                  key={p.name}
                  className="flex h-14 overflow-hidden rounded-xl border border-black/5 transition-transform duration-300 group-hover:-translate-y-1.5 sm:h-20"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <i className="w-1/2" style={{ background: p.dark }} />
                  <i className="w-1/2" style={{ background: p.light }} />
                </div>
              ))}
            </div>
          </article>

          <article data-reveal data-spotlight style={delay(90)} className={featureTile}>
            <FeatureIcon icon={LockKeyhole} />
            <h3 className="mt-6 text-xl font-semibold text-ink sm:text-2xl">Private by default</h3>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">QR codes are generated right in your browser. Nothing is uploaded to create a code.</p>
          </article>

          <article data-reveal data-spotlight style={delay(0)} className={featureTile}>
            <div className="flex items-start justify-between">
              <FeatureIcon icon={Download} />
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <Zap className="h-4 w-4" /> Instant
              </span>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-ink sm:text-2xl">Export in seconds</h3>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Sharp PNGs up to 2048 px, infinitely scalable SVGs, or copy straight to your clipboard.</p>
          </article>

          <article data-reveal data-spotlight style={delay(90)} className={`${featureTile} flex flex-col justify-between gap-8 md:col-span-2`}>
            <div>
              <h3 className="text-xl font-semibold text-ink sm:text-2xl">Five ways to connect</h3>
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Links, plain text, email drafts, phone numbers, and one-tap Wi-Fi join.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {types.map(({ icon: Icon, label }, i) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base font-medium text-slate-700 transition-transform duration-300 group-hover:-translate-y-1.5"
                  style={{ transitionDelay: `${i * 45}ms` }}
                >
                  <Icon className="h-[18px] w-[18px] text-slate-500" />
                  {label}
                </span>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
