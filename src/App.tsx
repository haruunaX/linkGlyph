import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildQrContent, defaults, safeFilename } from "./lib/qr";
import { readDraft, writeDraft } from "./lib/storage";
import { renderCanvas, renderSvg } from "./lib/render";
import type { ProjectState } from "./types";
import { Header } from "./components/Header";
import { ContentForm } from "./components/ContentForm";
import { OutputPanel, StylePanel } from "./components/StylePanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { Toast, type ToastMessage } from "./components/Toast";
import { Features, Hero } from "./components/Landing";
import { container, glass, tile } from "./components/ui";
import { useScrollReveal, useSpotlight } from "./lib/motion";
import { Marquee } from "./components/Marquee";

function Tile({ step, title, className = "", children }: { step?: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section data-reveal data-spotlight className={`${tile} p-4 sm:p-5 ${className}`} aria-label={title}>
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
        {step && <span className="text-[13px] font-medium tabular-nums text-slate-400">{step}</span>}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function App() {
  const [state, setState] = useState<ProjectState>(() => readDraft()?.state ?? structuredClone(defaults));
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const content = useMemo(() => buildQrContent(state), [state]);
  const toastId = useRef(0);
  useScrollReveal();
  useSpotlight();

  const notify = useCallback((text: string, tone: ToastMessage["tone"] = "success") => {
    toastId.current += 1;
    setToast({ id: toastId.current, text, tone });
  }, []);

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Remember the code in progress if the page is reloaded.
  useEffect(() => {
    const timer = window.setTimeout(() => writeDraft({ state }), 300);
    return () => window.clearTimeout(timer);
  }, [state]);

  const triggerDownload = (url: string, filename: string) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const downloadPng = async () => {
    const url = (await renderCanvas(state, content, state.size)).toDataURL("image/png");
    triggerDownload(url, `${safeFilename(state.name)}.png`);
    notify("PNG downloaded");
  };

  const downloadSvg = async () => {
    const svg = await renderSvg(state, content);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    triggerDownload(url, `${safeFilename(state.name)}.svg`);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("SVG downloaded");
  };

  const copyImage = async () => {
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) throw new Error("unsupported");
      const canvas = await renderCanvas(state, content, state.size);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      notify("Image copied to clipboard");
    } catch {
      notify("Copying images isn't supported in this browser", "info");
    }
  };

  return (
    <div id="top" className="min-h-screen bg-canvas">
      <Header />

      <main>
        {/* Hero + ribbon share exactly one screen below the header. */}
        <div className="flex min-h-[calc(100svh-4rem)] flex-col">
          <Hero />
          <Marquee />
        </div>

        <section id="studio" className="relative isolate scroll-mt-16 overflow-hidden border-t border-slate-200/80 lg:flex lg:min-h-[calc(100svh-4rem)] lg:flex-col lg:justify-center">
          {/* Soft color field so the glass panel has something to frost. */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute -left-24 top-24 h-[460px] w-[460px] animate-[drift-a_16s_ease-in-out_infinite_alternate] rounded-full bg-mint/35 blur-[110px]" />
            <div className="absolute -right-16 top-64 h-[500px] w-[500px] animate-[drift-b_19s_ease-in-out_infinite_alternate] rounded-full bg-periwinkle/35 blur-[120px]" />
          </div>
          <div className={`${container} py-10 sm:py-12 lg:py-[clamp(.75rem,2.5vh,2.5rem)]`}>
            <div data-reveal className="mb-5 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-end sm:justify-between lg:mb-[clamp(.75rem,2vh,1.5rem)]">
              <h2 className="text-heading font-semibold tracking-tight text-ink">QR code studio</h2>
              <p className="text-[15px] text-slate-500">Make a code, style it, then download it.</p>
            </div>

            <div className={glass}>
              <div className="grid gap-2.5 lg:grid-cols-12 [&>*]:min-w-0">
                <div data-reveal data-spotlight className={`${tile} order-first p-4 sm:p-5 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1`}>
                  <PreviewPanel
                    state={state}
                    content={content}
                    onName={(name) => setState((current) => ({ ...current, name }))}
                    onPng={() => void downloadPng()}
                    onSvg={() => void downloadSvg()}
                    onCopy={() => void copyImage()}
                  />
                </div>
                <Tile step="01" title="Content" className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
                  <ContentForm state={state} onChange={setState} />
                </Tile>
                <Tile step="02" title="Style" className="md:col-span-1 lg:col-span-4 lg:col-start-1 lg:row-start-2">
                  <StylePanel state={state} onChange={setState} />
                </Tile>
                <Tile step="03" title="Output" className="lg:col-span-3 lg:col-start-5 lg:row-start-2">
                  <OutputPanel state={state} onChange={setState} />
                </Tile>
              </div>
            </div>
          </div>
        </section>

        <Features />
      </main>

      <footer className="border-t border-slate-200/80">
        <p className={`${container} py-8 text-sm text-slate-400`}>QR codes are created in your browser. Always test a code before printing.</p>
      </footer>

      <Toast toast={toast} />
    </div>
  );
}
