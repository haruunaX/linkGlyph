import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { browserScanProof, buildQrContent, defaults, friendlyValue, safeFilename } from "./lib/qr";
import { duplicateInLibrary, readDraft, readLibrary, renameInLibrary, saveToLibrary, withDefaults, writeDraft, writeLibrary } from "./lib/storage";
import type { ProjectState, SavedProject, ScanProof } from "./types";
import { Header } from "./components/Header";
import { ContentForm } from "./components/ContentForm";
import { StylePanel } from "./components/StylePanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { Library } from "./components/Library";
import { Toast, type ToastMessage } from "./components/Toast";
import { card } from "./components/ui";

function toProjectState(project: SavedProject): ProjectState {
  const { type, fields, dark, light, size, level, margin, name } = withDefaults(project);
  return structuredClone({ type, fields, dark, light, size, level, margin, name });
}

const sameProject = (a: ProjectState, b: ProjectState) => JSON.stringify(a) === JSON.stringify(b);

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="mb-4 flex items-center gap-2.5 text-[15px] font-semibold text-ink">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-500">{n}</span>
        {title}
      </h2>
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    notify(`Opened "${project.name}"`);
  };

  const startNew = () => {
    setState(structuredClone({ ...defaults, name: "Untitled code" }));
    setActiveId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">QR code studio</h1>
          <p className="mt-1 text-[15px] text-slate-500">Make a code, check it scans, and save it to reuse later.</p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
          <div className="order-first lg:sticky lg:top-24 lg:order-last">
            <PreviewPanel
              state={state}
              content={content}
              scanProof={scanProof}
              status={status}
              onName={(name) => setState((current) => ({ ...current, name }))}
              onPng={() => void downloadPng()}
              onSvg={() => void downloadSvg()}
              onCopy={() => void copyImage()}
              onSave={save}
            />
          </div>
          <div className="space-y-5">
            <Step n={1} title="Content">
              <ContentForm state={state} onChange={setState} />
            </Step>
            <Step n={2} title="Style">
              <StylePanel state={state} onChange={setState} />
            </Step>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/80 pt-10">
          <Library items={library} activeId={activeId} onLoad={load} onRename={rename} onDuplicate={duplicate} onDelete={remove} />
        </div>
      </main>

      <footer className="border-t border-slate-200/80">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400 sm:px-6">QR codes are created in your browser. Saved codes stay on this device. Always test a code before printing.</p>
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
