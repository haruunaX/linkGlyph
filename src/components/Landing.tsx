import { FlaskConical, Layers3, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { card } from "./ui";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-mint ring-4 ring-mint/20" />
      {children}
    </span>
  );
}

const demoCells = [0, 1, 2, 5, 7, 10, 11, 12, 14, 17, 18, 20, 22, 23, 24];

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_.9fr] lg:pb-24">
      <div>
        <Eyebrow>Free, private, browser-based</Eyebrow>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl lg:text-6xl">
          Turn any link into a{" "}
          <span className="relative whitespace-nowrap">
            <span className="relative z-10">beautiful signal.</span>
            <span className="absolute inset-x-0 bottom-1 h-3 rounded-full bg-mint/60 sm:bottom-1.5" aria-hidden="true" />
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-8 text-slate-600">
          Create polished QR codes for websites, Wi-Fi, messages, and contact details. Customize every detail, prove it will scan, then export it in crisp formats.
        </p>
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <a
            href="#studio"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_rgba(11,18,32,.5)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            <Sparkles className="h-4 w-4 text-mint" />
            Create a QR code
          </a>
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Your projects stay in this browser
          </span>
        </div>
      </div>

      <div className={`${card} mx-auto w-full max-w-md p-5 sm:p-6 lg:mr-0`} aria-hidden="true">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-mint/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Scan Proof</span>
          <span className="text-xs text-slate-400">Live quality signal</span>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-5 rounded-xl bg-ink p-5 text-white">
          <div>
            <p className="text-xs text-slate-400">Ready for print</p>
            <strong className="mt-1.5 block text-2xl font-semibold tracking-tight">Reliable by design</strong>
            <p className="mt-2 text-[13px] leading-5 text-slate-300">Contrast, spacing, density, and export size checked before download.</p>
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-xl bg-white p-2.5">
            <div className="grid h-full w-full grid-cols-5 gap-[3px]">
              {Array.from({ length: 25 }, (_, i) => (
                <span key={i} className={`rounded-[1.5px] ${demoCells.includes(i) ? "bg-ink" : ""}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["4+", "Quiet zone"],
            ["AAA", "Contrast"],
            ["SVG", "Print ready"],
          ].map(([value, text]) => (
            <div key={text} className="rounded-lg bg-slate-50 px-2 py-3">
              <strong className="text-base font-semibold text-ink">{value}</strong>
              <span className="mt-0.5 block text-[11px] text-slate-500">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Layers3, title: "Designed, not default", copy: "Curated palettes, flexible content types, and sharp exports make every code feel intentional." },
  { icon: LockKeyhole, title: "Private by default", copy: "QR generation and saved projects stay in your browser. Nothing is uploaded to create a code." },
  { icon: FlaskConical, title: "Scan Proof included", copy: "Python-powered checks flag low contrast, tight margins, dense payloads, and undersized exports." },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-slate-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="text-center">
          <Eyebrow>Built for real life</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Confidence before the first scan</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-8 text-slate-600">
            LinkGlyph keeps the creative freedom of a design tool and adds the practical checks needed for packaging, events, menus, and printed materials.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <article key={title} className={`${card} p-6`}>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-mint">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-5 text-[17px] font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
