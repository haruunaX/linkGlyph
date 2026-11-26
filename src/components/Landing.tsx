import { useEffect, useState } from "react";
import { ArrowDown, FlaskConical, Globe2, Layers3, LockKeyhole, Mail, Phone, ShieldCheck, Type, Wifi } from "lucide-react";
import { prefersReducedMotion } from "../lib/motion";
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
const isSeparator = (r: number, c: number) => !isFinder(r, c) && (r < 4 && c < 4 || r < 4 && c >= SIZE - 4 || r >= SIZE - 4 && c < 4);

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
    <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-white p-2.5 sm:h-32 sm:w-32 sm:p-3" aria-hidden="true">
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
  return (
    <section className={`${container} pb-16 pt-8 sm:pt-12`}>
      <div className="grid gap-3 lg:grid-cols-12 lg:grid-rows-[1fr_auto] [&>*]:min-w-0">
        <div className={`${tile} flex flex-col justify-between p-7 sm:p-12 lg:col-span-7 lg:row-span-2`}>
          <div>
            <div data-reveal style={delay(0)}>
              <Eyebrow>Free, private, browser-based</Eyebrow>
            </div>
            <h1
              data-reveal
              style={delay(90)}
              className="mt-6 text-[36px] font-semibold leading-[1.03] tracking-[-0.035em] text-ink min-[380px]:text-[40px] sm:text-6xl xl:text-[72px]"
            >
              Turn any link into a{" "}
              <span className="relative sm:whitespace-nowrap">
                <span className="relative z-10">beautiful signal.</span>
                <span className="absolute inset-x-0 bottom-1.5 h-3.5 origin-left animate-[underline_.9s_.55s_cubic-bezier(.2,.7,.2,1)_both] bg-mint/70 sm:bottom-2 sm:h-4" aria-hidden="true" />
              </span>
            </h1>
            <p data-reveal style={delay(180)} className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
              Create polished QR codes for websites, Wi-Fi, messages, and contact details. Customize every detail, prove it will scan, then export it in crisp formats.
            </p>
          </div>
          <div data-reveal style={delay(270)} className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href="#studio"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-ink px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              Create a QR code
              <ArrowDown className="h-[18px] w-[18px] text-mint transition-transform group-hover:translate-y-0.5 motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]" />
            </a>
            <span className="inline-flex items-center gap-2 text-base text-slate-500">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              No sign-up needed
            </span>
          </div>
        </div>

        <div data-reveal style={delay(150)} className="grid grid-cols-[1fr_auto] items-center gap-5 rounded-2xl bg-ink p-6 text-white sm:gap-8 sm:p-8 lg:col-span-5">
          <div>
            <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">Scan Proof</span>
            <strong className="mt-5 block text-2xl font-semibold tracking-tight sm:text-3xl">Reliable by design</strong>
            <p className="mt-2 text-[15px] leading-6 text-slate-300">Contrast, spacing, density, and export size checked before download.</p>
          </div>
          <LiveGlyph />
        </div>

        <div className="grid grid-cols-3 gap-3 lg:col-span-5">
          {[
            ["4+", "Quiet zone"],
            ["AAA", "Contrast"],
            ["SVG", "Print ready"],
          ].map(([value, text], i) => (
            <div
              key={text}
              data-reveal
              style={delay(240 + i * 80)}
              className={`${tile} flex flex-col justify-between p-4 transition-colors hover:border-ink/30 sm:p-6`}
            >
              <strong className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{value}</strong>
              <span className="mt-4 text-sm text-slate-500">{text}</span>
            </div>
          ))}
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
    <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-mint transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
      <Icon className="h-5 w-5" />
    </span>
  );
}

const featureTile = `${tile} group p-7 transition-colors duration-300 hover:border-ink/25 sm:p-9`;

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-slate-200/80">
      <div className={`${container} py-20 lg:py-28`}>
        <div className="max-w-3xl" data-reveal>
          <Eyebrow>Built for real life</Eyebrow>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Confidence before the first scan</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            LinkGlyph keeps the creative freedom of a design tool and adds the practical checks needed for packaging, events, menus, and printed materials.
          </p>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-3">
          <article data-reveal style={delay(0)} className={`${featureTile} flex flex-col justify-between gap-10 md:col-span-2`}>
            <div>
              <FeatureIcon icon={Layers3} />
              <h3 className="mt-6 text-xl font-semibold text-ink sm:text-2xl">Designed, not default</h3>
              <p className="mt-3 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Curated palettes, flexible content types, and sharp exports make every code feel intentional.</p>
            </div>
            <div className="grid grid-cols-4 gap-2.5" aria-hidden="true">
              {presets.map((p, i) => (
                <div
                  key={p.name}
                  className="flex h-16 overflow-hidden rounded-xl border border-black/5 transition-transform duration-300 group-hover:-translate-y-1 sm:h-20"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <i className="w-1/2" style={{ background: p.dark }} />
                  <i className="w-1/2" style={{ background: p.light }} />
                </div>
              ))}
            </div>
          </article>

          <article data-reveal style={delay(90)} className={featureTile}>
            <FeatureIcon icon={LockKeyhole} />
            <h3 className="mt-6 text-xl font-semibold text-ink sm:text-2xl">Private by default</h3>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">QR codes are generated right in your browser. Nothing is uploaded to create a code.</p>
          </article>

          <article data-reveal style={delay(0)} className={featureTile}>
            <div className="flex items-start justify-between">
              <FeatureIcon icon={FlaskConical} />
              <span className="text-4xl font-semibold tabular-nums tracking-tight text-ink">
                100<span className="text-base font-medium text-slate-300">/100</span>
              </span>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-ink sm:text-2xl">Scan Proof included</h3>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Python-powered checks flag low contrast, tight margins, dense payloads, and undersized exports.</p>
          </article>

          <article data-reveal style={delay(90)} className={`${featureTile} flex flex-col justify-between gap-8 md:col-span-2`}>
            <div>
              <h3 className="text-xl font-semibold text-ink sm:text-2xl">Five ways to connect</h3>
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Links, plain text, email drafts, phone numbers, and one-tap Wi-Fi join.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {types.map(({ icon: Icon, label }, i) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base font-medium text-slate-700 transition-transform duration-300 group-hover:-translate-y-1"
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
