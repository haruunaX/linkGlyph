import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  ChevronDown,
  Clock3,
  Download,
  FlaskConical,
  Globe2,
  Layers3,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Type,
  Wifi,
  X,
} from "lucide-react";
import { browserScanProof, buildQrContent, defaults, friendlyValue, safeFilename } from "./lib/qr";
import type { ErrorLevel, ProjectState, QrFields, QrType, SavedProject, ScanProof } from "./types";

const STORAGE_KEY = "linkglyph-projects";

const typeOptions: Array<{ id: QrType; label: string; icon: typeof Globe2 }> = [
  { id: "url", label: "Link", icon: Globe2 },
  { id: "text", label: "Text", icon: Type },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
];

const presets = [
  { name: "Ink", dark: "#0B1220", light: "#FFFFFF" },
  { name: "Grove", dark: "#194D3C", light: "#EFFFF7" },
  { name: "Iris", dark: "#2C2470", light: "#F1EEFF" },
  { name: "Ember", dark: "#6F2D24", light: "#FFF1E7" },
];

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-slate-400 focus:border-periwinkle focus:ring-4 focus:ring-periwinkle/15";
const labelClass = "block text-sm font-semibold text-slate-700";
const selectClass = `${inputClass} appearance-none pr-11`;

function readSaved(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedProject[];
  } catch {
    return [];
  }
}

function Brand() {
  return (
    <a href="#top" className="group inline-flex items-center gap-3 font-display text-xl font-bold tracking-tight text-ink">
      <span className="relative grid h-10 w-10 grid-cols-3 gap-0.5 rounded-xl bg-ink p-2 shadow-[0_8px_24px_rgba(11,18,32,.18)] transition group-hover:-rotate-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
          <i
            key={cell}
            className={`rounded-[2px] ${[0, 1, 3, 4, 7].includes(cell) ? "bg-mint" : cell === 8 ? "bg-periwinkle" : "bg-white/10"}`}
          />
        ))}
      </span>
      LinkGlyph
    </a>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
      <span className="h-2 w-2 rounded-full bg-mint ring-4 ring-mint/20" />
      {children}
    </span>
  );
}

function SelectChevron() {
  return <ChevronDown className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 text-slate-500" />;
}

function App() {
  const [state, setState] = useState<ProjectState>(() => structuredClone(defaults));
  const [saved, setSaved] = useState<SavedProject[]>(readSaved);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [scanProof, setScanProof] = useState<ScanProof>(() => browserScanProof(defaults, buildQrContent(defaults)));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const content = useMemo(() => buildQrContent(state), [state]);

  const showToast = (message: string) => setToast(message);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void QRCode.toCanvas(canvas, content, {
      width: 320,
      margin: state.margin,
      errorCorrectionLevel: state.level,
      color: { dark: state.dark, light: state.light },
    });
  }, [content, state.dark, state.light, state.level, state.margin]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const updateField = <K extends keyof QrFields>(key: K, value: QrFields[K]) => {
    setState((current) => ({ ...current, fields: { ...current.fields, [key]: value } }));
  };

  const applyPreset = (dark: string, light: string) => setState((current) => ({ ...current, dark, light }));

  const triggerDownload = (url: string, filename: string) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const downloadPng = async () => {
    const url = await QRCode.toDataURL(content, {
      width: state.size,
      margin: state.margin,
      errorCorrectionLevel: state.level,
      color: { dark: state.dark, light: state.light },
    });
    triggerDownload(url, `${safeFilename(state.name)}.png`);
    showToast("PNG downloaded");
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(content, {
      type: "svg",
      margin: state.margin,
      errorCorrectionLevel: state.level,
      color: { dark: state.dark, light: state.light },
    });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    triggerDownload(url, `${safeFilename(state.name)}.svg`);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("SVG downloaded");
  };

  const saveProject = () => {
    const project: SavedProject = {
      ...structuredClone(state),
      id: crypto.randomUUID(),
      content: friendlyValue(state),
      savedAt: new Date().toISOString(),
    };
    const next = [project, ...saved].slice(0, 12);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    showToast("Saved to My codes");
  };

  const loadProject = (project: SavedProject) => {
    setState({
      ...structuredClone(defaults),
      ...structuredClone(project),
      fields: { ...structuredClone(defaults.fields), ...structuredClone(project.fields) },
    });
    setDrawerOpen(false);
    document.querySelector("#studio")?.scrollIntoView({ behavior: "smooth" });
    showToast("Project loaded");
  };

  const deleteProject = (id: string) => {
    const next = saved.filter((project) => project.id !== id);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    showToast("Project removed");
  };

  const renderFields = () => {
    if (state.type === "url") {
      return (
        <label className={labelClass}>
          Website or link
          <input className={inputClass} type="url" value={state.fields.url} onChange={(event) => updateField("url", event.target.value)} placeholder="https://example.com" />
          <span className="mt-2 block text-sm font-normal text-slate-500">Use the complete address, including https://</span>
        </label>
      );
    }
    if (state.type === "text") {
      return (
        <label className={labelClass}>
          Message or plain text
          <textarea className={`${inputClass} min-h-32 resize-y`} maxLength={1200} value={state.fields.text} onChange={(event) => updateField("text", event.target.value)} />
        </label>
      );
    }
    if (state.type === "email") {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Email address<input className={inputClass} type="email" value={state.fields.email} onChange={(event) => updateField("email", event.target.value)} placeholder="hello@example.com" /></label>
          <label className={labelClass}>Subject<input className={inputClass} value={state.fields.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Let’s connect" /></label>
          <label className={`${labelClass} sm:col-span-2`}>Message<textarea className={`${inputClass} min-h-28 resize-y`} value={state.fields.body} onChange={(event) => updateField("body", event.target.value)} placeholder="Optional email message" /></label>
        </div>
      );
    }
    if (state.type === "phone") {
      return (
        <label className={labelClass}>Phone number<input className={inputClass} type="tel" value={state.fields.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+63 912 345 6789" /></label>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Network name<input className={inputClass} value={state.fields.ssid} onChange={(event) => updateField("ssid", event.target.value)} placeholder="My Wi-Fi" /></label>
        <label className={`${labelClass} relative`}>Security<select className={selectClass} value={state.fields.encryption} onChange={(event) => updateField("encryption", event.target.value as QrFields["encryption"])}><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select><SelectChevron /></label>
        <label className={`${labelClass} sm:col-span-2`}>Password<input className={inputClass} disabled={state.fields.encryption === "nopass"} value={state.fields.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Network password" /></label>
      </div>
    );
  };

  const scoreColor = scanProof.score >= 90 ? "text-emerald-700" : scanProof.score >= 72 ? "text-amber-700" : "text-rose-700";
  const scoreBg = scanProof.score >= 90 ? "bg-emerald-500" : scanProof.score >= 72 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-canvas">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(94,230,168,.18),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(142,161,255,.2),transparent_35%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Brand />
        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Primary navigation">
          <a href="#studio" className="hidden text-sm font-semibold text-slate-600 hover:text-ink sm:block">Studio</a>
          <a href="#features" className="hidden text-sm font-semibold text-slate-600 hover:text-ink md:block">Why LinkGlyph</a>
          <button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Clock3 className="h-4 w-4" />
            <span className="hidden sm:inline">My codes</span>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] text-white">{saved.length}</span>
          </button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-32 lg:pt-20">
          <div>
            <Eyebrow>Free, private, browser-based</Eyebrow>
            <h1 className="mt-7 max-w-3xl font-display text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
              Turn any link into a <span className="relative whitespace-nowrap text-indigo-700"><span className="relative z-10">beautiful signal.</span><span className="absolute bottom-1 left-0 -z-0 h-3 w-full -rotate-1 rounded-full bg-mint/70" /></span>
            </h1>
            <p className="mt-7 max-w-2xl text-balance text-lg leading-8 text-slate-600">Create polished QR codes for websites, Wi-Fi, messages, and contact details. Customize every detail, prove it will scan, then export it in crisp formats.</p>
            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <a href="#studio" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_35px_rgba(11,18,32,.22)] transition hover:-translate-y-0.5 hover:bg-slate-800"><Sparkles className="h-4 w-4 text-mint" />Create a QR code</a>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ShieldCheck className="h-5 w-5 text-emerald-600" />Your projects stay in this browser</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mr-0">
            <div className="absolute -inset-10 rounded-full bg-periwinkle/20 blur-3xl" />
            <div className="relative rotate-2 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_35px_90px_rgba(28,40,86,.18)] backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between"><span className="rounded-full bg-mint/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">Scan Proof</span><span className="text-xs font-semibold text-slate-400">Live quality signal</span></div>
              <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-5 rounded-3xl bg-ink p-5 text-white">
                <div><p className="text-sm text-slate-400">Ready for print</p><strong className="mt-2 block font-display text-3xl">Reliable by design</strong><p className="mt-3 text-sm leading-6 text-slate-300">Contrast, spacing, density, and export size checked before download.</p></div>
                <div className="grid h-24 w-24 place-items-center rounded-[1.4rem] bg-white p-3 shadow-xl"><div className="grid h-full w-full grid-cols-5 gap-1">{Array.from({ length: 25 }, (_, index) => <span key={index} className={`rounded-[1px] ${[0,1,2,5,7,10,11,12,14,17,18,20,22,23,24].includes(index) ? "bg-ink" : "bg-transparent"}`} />)}</div></div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-slate-50 p-3"><strong className="font-display text-lg">4+</strong><span className="mt-1 block text-xs text-slate-500">Quiet zone</span></div><div className="rounded-2xl bg-slate-50 p-3"><strong className="font-display text-lg">AAA</strong><span className="mt-1 block text-xs text-slate-500">Contrast</span></div><div className="rounded-2xl bg-slate-50 p-3"><strong className="font-display text-lg">SVG</strong><span className="mt-1 block text-xs text-slate-500">Print ready</span></div></div>
            </div>
          </div>
        </section>

        <section id="studio" className="border-y border-slate-200/80 bg-white/70 py-24 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Eyebrow>QR Studio</Eyebrow><h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Create your glyph</h2></div><p className="max-w-md text-base leading-7 text-slate-500">Choose what it opens, shape the visual system, and let Scan Proof catch reliability issues.</p></div>

            <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(11,18,32,.1)] lg:grid-cols-[1.16fr_.84fr]">
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-mint">01</span><div><h3 className="font-display text-xl font-bold">What should it open?</h3><p className="mt-1 text-sm text-slate-500">Select a content type and add the details.</p></div></div>
                <div role="tablist" aria-label="QR content type" className="mt-6 grid grid-cols-5 gap-1 rounded-2xl bg-slate-100 p-1.5">
                  {typeOptions.map(({ id, label, icon: Icon }) => {
                    const active = state.type === id;
                    return <button key={id} type="button" role="tab" aria-selected={active} onClick={() => setState((current) => ({ ...current, type: id }))} className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:flex-row sm:text-sm ${active ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"}`}><Icon className="h-4 w-4 shrink-0" /><span className="truncate">{label}</span></button>;
                  })}
                </div>
                <div className="mt-6" aria-live="polite">{renderFields()}</div>

                <div className="my-9 h-px bg-slate-200" />
                <div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-700 font-display text-sm font-bold text-white">02</span><div><h3 className="font-display text-xl font-bold">Style your code</h3><p className="mt-1 text-sm text-slate-500">Use a curated palette or choose your own.</p></div></div>
                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {presets.map((preset) => {
                    const active = state.dark === preset.dark && state.light === preset.light;
                    return <button key={preset.name} type="button" onClick={() => applyPreset(preset.dark, preset.light)} className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition ${active ? "border-ink bg-slate-50 ring-2 ring-ink/10" : "border-slate-200 hover:border-slate-300"}`}><span className="flex h-7 w-7 overflow-hidden rounded-full border border-slate-200"><i className="h-full w-1/2" style={{ background: preset.dark }} /><i className="h-full w-1/2" style={{ background: preset.light }} /></span>{preset.name}</button>;
                  })}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>Code color<div className="mt-2 flex rounded-2xl border border-slate-200 bg-white p-1.5 focus-within:border-periwinkle focus-within:ring-4 focus-within:ring-periwinkle/15"><input className="h-11 w-12 cursor-pointer rounded-xl border-0 bg-transparent p-0" type="color" value={state.dark} onChange={(event) => setState((current) => ({ ...current, dark: event.target.value.toUpperCase() }))} /><input className="min-w-0 flex-1 px-3 font-mono text-sm uppercase outline-none" value={state.dark} maxLength={7} onChange={(event) => /^#[0-9a-f]{0,6}$/i.test(event.target.value) && setState((current) => ({ ...current, dark: event.target.value.toUpperCase() }))} /></div></label>
                  <label className={labelClass}>Background<div className="mt-2 flex rounded-2xl border border-slate-200 bg-white p-1.5 focus-within:border-periwinkle focus-within:ring-4 focus-within:ring-periwinkle/15"><input className="h-11 w-12 cursor-pointer rounded-xl border-0 bg-transparent p-0" type="color" value={state.light} onChange={(event) => setState((current) => ({ ...current, light: event.target.value.toUpperCase() }))} /><input className="min-w-0 flex-1 px-3 font-mono text-sm uppercase outline-none" value={state.light} maxLength={7} onChange={(event) => /^#[0-9a-f]{0,6}$/i.test(event.target.value) && setState((current) => ({ ...current, light: event.target.value.toUpperCase() }))} /></div></label>
                  <label className={`${labelClass} relative`}>Export size<select className={selectClass} value={state.size} onChange={(event) => setState((current) => ({ ...current, size: Number(event.target.value) }))}><option value={512}>512 × 512</option><option value={1024}>1024 × 1024</option><option value={2048}>2048 × 2048</option></select><SelectChevron /></label>
                  <label className={`${labelClass} relative`}>Error correction<select className={selectClass} value={state.level} onChange={(event) => setState((current) => ({ ...current, level: event.target.value as ErrorLevel }))}><option value="L">Low · 7%</option><option value="M">Medium · 15%</option><option value="Q">Quartile · 25%</option><option value="H">High · 30%</option></select><SelectChevron /></label>
                </div>

                <label className={`${labelClass} mt-6`}>Quiet zone <span className="float-right text-sm font-medium text-slate-500">{state.margin} modules</span><input className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-700" type="range" min={2} max={10} value={state.margin} onChange={(event) => setState((current) => ({ ...current, margin: Number(event.target.value) }))} /></label>
              </div>

              <aside className="relative overflow-hidden bg-ink p-5 text-white sm:p-8 lg:p-10" aria-label="QR code preview">
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-[.18]" />
                <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-periwinkle/25 blur-3xl" />
                <div className="relative flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live preview</span><span className={`inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ${scoreColor}`}><i className={`h-2 w-2 rounded-full ${scoreBg}`} />{scanProof.grade}</span></div>
                <div className="relative mt-7 rounded-[1.75rem] bg-white/8 p-4 sm:p-7">
                  <div className="mx-auto max-w-sm rounded-[1.5rem] p-5 shadow-[0_26px_60px_rgba(0,0,0,.3)]" style={{ background: state.light }}>
                    <canvas ref={canvasRef} className="mx-auto block h-auto w-full max-w-[320px]" aria-label="Generated QR code" />
                    <div className="mt-4 border-t px-1 pt-4" style={{ borderColor: `${state.dark}20`, color: state.dark }}><strong className="block truncate font-display text-lg">{state.name || "Untitled glyph"}</strong><span className="mt-1 block truncate text-sm opacity-65">{friendlyValue(state)}</span></div>
                  </div>
                </div>

                <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/[.07] p-4">
                  <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint/15 text-mint"><FlaskConical className="h-5 w-5" /></span><div><strong className="block text-sm">Scan Proof</strong><span className="text-xs text-slate-400">{scanProof.source === "python" ? "Python API" : "Browser fallback"} · {scanProof.contrast_ratio}:1 contrast</span></div></div><strong className="font-display text-3xl text-mint">{scanProof.score}</strong></div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all ${scoreBg}`} style={{ width: `${scanProof.score}%` }} /></div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{scanProof.recommendations[0]}</p>
                </div>

                <label className="relative mt-5 block text-sm font-semibold text-slate-300">Project name<input className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-slate-500 focus:border-mint/60 focus:ring-4 focus:ring-mint/10" maxLength={40} value={state.name} onChange={(event) => setState((current) => ({ ...current, name: event.target.value }))} /></label>
                <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-2"><button type="button" onClick={() => void downloadPng()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-mint px-5 py-3.5 text-sm font-bold text-ink transition hover:bg-emerald-300"><Download className="h-4 w-4" />Download PNG</button><button type="button" onClick={() => void downloadSvg()} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-bold hover:bg-white/15">SVG</button></div>
                <button type="button" onClick={saveProject} className="relative mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"><Save className="h-4 w-4" />Save to my codes</button>
                <p className="relative mt-4 text-center text-xs leading-5 text-slate-500">Static QR codes never expire. Always test before printing.</p>
              </aside>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="text-center"><Eyebrow>Built for real life</Eyebrow><h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Confidence before the first scan</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">LinkGlyph keeps the creative freedom of a design tool and adds the practical checks needed for packaging, events, menus, and printed materials.</p></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[{ icon: Layers3, title: "Designed, not default", copy: "Curated palettes, flexible content types, and sharp exports make every code feel intentional." }, { icon: LockKeyhole, title: "Private by default", copy: "QR generation and saved projects stay in your browser. Nothing is uploaded to create a code." }, { icon: FlaskConical, title: "Scan Proof included", copy: "Python-powered checks flag low contrast, tight margins, dense payloads, and undersized exports." }].map(({ icon: Icon, title, copy }) => <article key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(11,18,32,.06)]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-mint"><Icon className="h-5 w-5" /></span><h3 className="mt-6 font-display text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{copy}</p></article>)}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-5 py-8 sm:flex-row sm:items-center sm:px-8 lg:px-12"><Brand /><p className="text-sm text-slate-500">Make every connection visible.</p></div></footer>

      {drawerOpen && <div className="fixed inset-0 z-50"><button type="button" aria-label="Close saved codes" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-ink/45 backdrop-blur-sm" /><section role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><Eyebrow>Local library</Eyebrow><h2 id="drawer-title" className="mt-3 font-display text-3xl font-bold">My codes</h2><p className="mt-2 text-sm text-slate-500">Saved only in this browser on this device.</p></div><button type="button" aria-label="Close" onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button></div><div className="mt-8 space-y-3">{saved.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Sparkles className="mx-auto h-7 w-7 text-slate-400" /><strong className="mt-4 block font-display text-lg">No saved codes yet</strong><p className="mt-2 text-sm leading-6 text-slate-500">Create one in the studio, then save it here.</p></div> : saved.map((project) => <article key={project.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"><button type="button" onClick={() => loadProject(project)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-xl font-bold" style={{ background: project.light, color: project.dark }}>⌘</span><span className="min-w-0"><strong className="block truncate text-sm">{project.name}</strong><span className="mt-1 block truncate text-xs text-slate-500">{project.content}</span></span></button><button type="button" aria-label={`Delete ${project.name}`} onClick={() => deleteProject(project.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></article>)}</div></section></div>}

      <div role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-2xl transition duration-300 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}><Check className="h-4 w-4 text-mint" />{toast}</div>
    </div>
  );
}

export default App;
