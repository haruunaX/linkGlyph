import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { browserScanProof, buildQrContent, defaults, safeFilename } from "./lib/qr";
import { readDraft, writeDraft } from "./lib/storage";
import type { ProjectState, ScanProof } from "./types";
import { Header } from "./components/Header";
import { ContentForm } from "./components/ContentForm";
import { AdvancedPanel, StylePanel } from "./components/StylePanel";
import { PreviewPanel, ScanProofTile } from "./components/PreviewPanel";
import { Toast, type ToastMessage } from "./components/Toast";
import { Features, Hero } from "./components/Landing";
import { container, glass, tile } from "./components/ui";
import { useScrollReveal } from "./lib/motion";

const scrollToStudio = () => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });

function Tile({ step, title, className = "", children }: { step?: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section data-reveal className={`${tile} p-5 sm:p-7 ${className}`} aria-label={title}>
      <h3 className="mb-5 flex items-center gap-2.5 text-base font-semibold text-ink sm:text-lg">
        {step && <span className="text-sm font-medium tabular-nums text-slate-400">{step}</span>}
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
  const [scanProof, setScanProof] = useState<ScanProof>(() => browserScanProof(state, content));
  const toastId = useRef(0);
  useScrollReveal();

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

  // Scan Proof: instant browser score, upgraded by the Python API when reachable.
  useEffect(() => {
    const fallback = browserScanProof(state, content);
    setScanProof(fallback);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/qr/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            foreground: state.dark,
            background: state.light,
            size: state.size,
            margin: state.margin,
            error_correction: state.level,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Scan Proof API unavailable");
        setScanProof((await response.json()) as ScanProof);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setScanProof(fallback);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [content, state]);

  const qrOptions = { margin: state.margin, errorCorrectionLevel: state.level, color: { dark: state.dark, light: state.light } };

  const triggerDownload = (url: string, filename: string) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const downloadPng = async () => {
    const url = await QRCode.toDataURL(content, { ...qrOptions, width: state.size });
    triggerDownload(url, `${safeFilename(state.name)}.png`);
    notify("PNG downloaded");
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(content, { ...qrOptions, type: "svg" });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    triggerDownload(url, `${safeFilename(state.name)}.svg`);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("SVG downloaded");
  };

  const copyImage = async () => {
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) throw new Error("unsupported");
      const url = await QRCode.toDataURL(content, { ...qrOptions, width: state.size });
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      notify("Image copied to clipboard");
    } catch {
      notify("Copying images isn't supported in this browser", "info");
    }
  };

  const startNew = () => {
    setState(structuredClone({ ...defaults, name: "Untitled code" }));
    scrollToStudio();
  };

  return (
    <div id="top" className="min-h-screen bg-canvas">
      <Header onNew={startNew} />

      <main>
        <Hero />

        <section id="studio" className="relative isolate scroll-mt-16 overflow-hidden border-t border-slate-200/80">
          {/* Soft color field so the glass panel has something to frost. */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute -left-24 top-24 h-[460px] w-[460px] animate-[drift-a_16s_ease-in-out_infinite_alternate] rounded-full bg-mint/35 blur-[110px]" />
            <div className="absolute -right-16 top-64 h-[500px] w-[500px] animate-[drift-b_19s_ease-in-out_infinite_alternate] rounded-full bg-periwinkle/35 blur-[120px]" />
          </div>
          <div className={`${container} pb-20 pt-12 sm:pt-16`}>
            <div data-reveal className="mb-7 sm:mb-10">
              <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-[42px]">QR code studio</h2>
              <p className="mt-2 text-lg text-slate-500">Make a code, check it scans, then download it.</p>
            </div>

            <div className={glass}>
              <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-12 [&>*]:min-w-0">
                <div data-reveal className={`${tile} order-first p-4 sm:p-6 lg:order-none lg:p-4 xl:p-6 lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1`}>
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
                <Tile step="02" title="Style" className="lg:col-span-7 lg:col-start-1 lg:row-start-2">
                  <StylePanel state={state} onChange={setState} />
                </Tile>
                <Tile step="03" title="Output" className="lg:col-span-4 lg:col-start-1 lg:row-start-3">
                  <AdvancedPanel state={state} onChange={setState} />
                </Tile>
                <Tile title="Scan Proof" className="lg:col-span-3 lg:col-start-5 lg:row-start-3">
                  <ScanProofTile scanProof={scanProof} />
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
