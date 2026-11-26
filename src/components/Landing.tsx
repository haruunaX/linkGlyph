import { ArrowDown, FlaskConical, Globe2, Layers3, LockKeyhole, Mail, Phone, ShieldCheck, Type, Wifi } from "lucide-react";
import { presets } from "./StylePanel";
import { tile } from "./ui";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-mint" />
      {children}
    </span>
  );
}

const demoCells = [0, 1, 2, 5, 7, 10, 11, 12, 14, 17, 18, 20, 22, 23, 24];

function MiniGlyph({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-5 gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: 25 }, (_, i) => (
        <span key={i} className={`aspect-square rounded-[2px] ${demoCells.includes(i) ? "bg-ink" : ""}`} />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12">
      <div className="grid gap-3 lg:grid-cols-12 lg:grid-rows-[auto_auto] [&>*]:min-w-0">
        <div className={`${tile} flex flex-col justify-between p-7 sm:p-10 lg:col-span-7 lg:row-span-2`}>
          <div>
            <Eyebrow>Free, private, browser-based</Eyebrow>
            <h1 className="mt-6 text-[34px] font-semibold min-[380px]:text-4xl leading-[1.04] tracking-[-0.035em] text-ink sm:text-5xl lg:text-[58px]">
              Turn any link into a{" "}
              <span className="relative sm:whitespace-nowrap">
                <span className="relative z-10">beautiful signal.</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-mint/70 sm:bottom-1.5" aria-hidden="true" />
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-8 text-slate-600">
              Create polished QR codes for websites, Wi-Fi, messages, and contact details. Customize every detail, prove it will scan, then export it in crisp formats.
            </p>
          </div>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href="#studio"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              Create a QR code
              <ArrowDown className="h-4 w-4 text-mint" />
            </a>
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              No sign-up needed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-5 rounded-2xl bg-ink p-6 sm:gap-6 sm:p-7 text-white lg:col-span-5">
          <div>
            <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">Scan Proof</span>
            <strong className="mt-4 block text-2xl font-semibold tracking-tight">Reliable by design</strong>
            <p className="mt-2 text-[13px] leading-5 text-slate-300">Contrast, spacing, density, and export size checked before download.</p>
          </div>
          <div className="h-20 w-20 rounded-xl bg-white p-2.5 sm:h-24 sm:w-24 sm:p-3">
            <MiniGlyph />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:col-span-5">
          {[
            ["4+", "Quiet zone"],
            ["AAA", "Contrast"],
            ["SVG", "Print ready"],
          ].map(([value, text]) => (
            <div key={text} className={`${tile} flex flex-col justify-between p-4 sm:p-5`}>
              <strong className="text-2xl font-semibold tracking-tight text-ink">{value}</strong>
              <span className="mt-3 text-xs text-slate-500">{text}</span>
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
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-mint">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-slate-200/80">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <Eyebrow>Built for real life</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Confidence before the first scan</h2>
          <p className="mt-4 text-[17px] leading-8 text-slate-600">
            LinkGlyph keeps the creative freedom of a design tool and adds the practical checks needed for packaging, events, menus, and printed materials.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <article className={`${tile} flex flex-col justify-between gap-8 p-7 md:col-span-2`}>
            <div>
              <FeatureIcon icon={Layers3} />
              <h3 className="mt-5 text-lg font-semibold text-ink">Designed, not default</h3>
              <p className="mt-2 max-w-md text-[15px] leading-7 text-slate-600">Curated palettes, flexible content types, and sharp exports make every code feel intentional.</p>
            </div>
            <div className="grid grid-cols-4 gap-2" aria-hidden="true">
              {presets.map((p) => (
                <div key={p.name} className="flex h-14 overflow-hidden rounded-xl border border-black/5">
                  <i className="w-1/2" style={{ background: p.dark }} />
                  <i className="w-1/2" style={{ background: p.light }} />
                </div>
              ))}
            </div>
          </article>

          <article className={`${tile} p-7`}>
            <FeatureIcon icon={LockKeyhole} />
            <h3 className="mt-5 text-lg font-semibold text-ink">Private by default</h3>
            <p className="mt-2 text-[15px] leading-7 text-slate-600">QR codes are generated right in your browser. Nothing is uploaded to create a code.</p>
          </article>

          <article className={`${tile} p-7`}>
            <div className="flex items-start justify-between">
              <FeatureIcon icon={FlaskConical} />
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
                100<span className="text-sm font-medium text-slate-300">/100</span>
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">Scan Proof included</h3>
            <p className="mt-2 text-[15px] leading-7 text-slate-600">Python-powered checks flag low contrast, tight margins, dense payloads, and undersized exports.</p>
          </article>

          <article className={`${tile} flex flex-col justify-between gap-6 p-7 md:col-span-2`}>
            <div>
              <h3 className="text-lg font-semibold text-ink">Five ways to connect</h3>
              <p className="mt-2 text-[15px] leading-7 text-slate-600">Links, plain text, email drafts, phone numbers, and one-tap Wi-Fi join.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {types.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700">
                  <Icon className="h-4 w-4 text-slate-500" />
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
