import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { browserScanProof, buildQrContent, defaults, friendlyValue, safeFilename } from "./lib/qr";
import { duplicateInLibrary, readDraft, readLibrary, renameInLibrary, saveToLibrary, withDefaults, writeDraft, writeLibrary } from "./lib/storage";
import type { ProjectState, SavedProject, ScanProof } from "./types";
import { Header } from "./components/Header";
import { ContentForm } from "./components/ContentForm";
import { AdvancedPanel, StylePanel } from "./components/StylePanel";
import { PreviewPanel, ScanProofTile } from "./components/PreviewPanel";
import { Library } from "./components/Library";
import { Toast, type ToastMessage } from "./components/Toast";
import { Features, Hero } from "./components/Landing";
import { glass, tile } from "./components/ui";

function toProjectState(project: SavedProject): ProjectState {
  const { type, fields, dark, light, size, level, margin, name } = withDefaults(project);
  return structuredClone({ type, fields, dark, light, size, level, margin, name });
}

const sameProject = (a: ProjectState, b: ProjectState) => JSON.stringify(a) === JSON.stringify(b);

const scrollToStudio = () => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });

function Tile({ step, title, className = "", children }: { step?: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`${tile} p-5 sm:p-6 ${className}`} aria-label={title}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        {step && <span className="text-xs font-medium tabular-nums text-slate-400">{step}</span>}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function App() {
  const initialDraft = useMemo(() => readDraft(), []);
  const [state, setState] = useState<ProjectState>(() => initialDraft?.state ?? structuredClone(defaults));
  const [library, setLibrary] = useState<SavedProject[]>(readLibrary);
  const [activeId, setActiveId] = useState<string | null>(initialDraft?.activeId ?? null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const content = useMemo(() => buildQrContent(state), [state]);
  const [scanProof, setScanProof] = useState<ScanProof>(() => browserScanProof(state, content));
  const toastId = useRef(0);

  const active = library.find((item) => item.id === activeId) ?? null;
  const status: "new" | "saved" | "edited" = !active ? "new" : sameProject(toProjectState(active), state) ? "saved" : "edited";

  const notify = useCallback((text: string, extra: Omit<ToastMessage, "id" | "text"> = {}) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text, ...extra });
  }, []);

  const updateLibrary = (next: SavedProject[]) => {
    setLibrary(next);
    writeLibrary(next);
  };

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.action ? 5000 : 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Remember the work in progress between visits.
  useEffect(() => {
    const timer = window.setTimeout(() => writeDraft({ state, activeId: active ? activeId : null }), 300);
    return () => window.clearTimeout(timer);
  }, [state, activeId, active]);

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
      notify("Copying images isn't supported in this browser", { tone: "info" });
    }
  };

  const save = useCallback(() => {
    const name = state.name.trim() || "Untitled code";
    const project: SavedProject = {
      ...structuredClone({ ...state, name }),
      id: active ? active.id : crypto.randomUUID(),
      content: friendlyValue(state),
      savedAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, name }));
    setLibrary((current) => {
      const next = saveToLibrary(current, project);
      writeLibrary(next);
      return next;
    });
    setActiveId(project.id);
    notify(active ? "Changes saved" : "Saved to My codes");
  }, [state, active, notify]);

  // Ctrl/Cmd+S saves instead of opening the browser's "Save page" dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const load = (project: SavedProject) => {
    setState(toProjectState(project));
    setActiveId(project.id);
    scrollToStudio();
    notify(`Opened "${project.name}"`);
  };

  const startNew = () => {
    setState(structuredClone({ ...defaults, name: "Untitled code" }));
    setActiveId(null);
    scrollToStudio();
  };

  const rename = (id: string, name: string) => {
    updateLibrary(renameInLibrary(library, id, name));
    const clean = name.trim().slice(0, 40);
    if (id === activeId && clean) setState((current) => ({ ...current, name: clean }));
  };

  const duplicate = (id: string) => {
    updateLibrary(duplicateInLibrary(library, id));
    notify("Duplicated");
  };

  const remove = (id: string) => {
    const index = library.findIndex((item) => item.id === id);
    if (index === -1) return;
    const removed = library[index];
    updateLibrary(library.filter((item) => item.id !== id));
    notify(`Deleted "${removed.name}"`, {
      tone: "info",
      action: {
        label: "Undo",
        run: () =>
          setLibrary((current) => {
            const next = [...current.slice(0, index), removed, ...current.slice(index)];
            writeLibrary(next);
            return next;
          }),
      },
    });
  };

  return (
    <div id="top" className="min-h-screen bg-canvas">
      <Header savedCount={library.length} onNew={startNew} />

      <main>
        <Hero />

        <section id="studio" className="relative isolate scroll-mt-16 overflow-hidden border-t border-slate-200/80">
          {/* Soft color field so the glass panel has something to frost. */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute -left-24 top-24 h-[420px] w-[420px] rounded-full bg-mint/35 blur-[110px]" />
            <div className="absolute -right-16 top-64 h-[460px] w-[460px] rounded-full bg-periwinkle/35 blur-[120px]" />
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">QR code studio</h2>
              <p className="mt-1 text-[15px] text-slate-500">Make a code, check it scans, and save it to reuse later.</p>
            </div>

            <div className={glass}>
              <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-12 [&>*]:min-w-0">
                <div className={`${tile} order-first p-4 sm:p-5 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1`}>
                  <PreviewPanel
                    state={state}
                    content={content}
                    status={status}
                    onName={(name) => setState((current) => ({ ...current, name }))}
                    onPng={() => void downloadPng()}
                    onSvg={() => void downloadSvg()}
                    onCopy={() => void copyImage()}
                    onSave={save}
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

            <div className="mt-12 border-t border-slate-200/80 pt-10">
              <Library items={library} activeId={activeId} onLoad={load} onRename={rename} onDuplicate={duplicate} onDelete={remove} />
            </div>
          </div>
        </section>

        <Features />
      </main>

      <footer className="border-t border-slate-200/80">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400 sm:px-6">QR codes are created in your browser. Saved codes stay on this device. Always test a code before printing.</p>
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
