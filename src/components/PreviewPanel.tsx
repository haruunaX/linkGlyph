import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Check, AlertCircle, ClipboardCopy, Download, Save } from "lucide-react";
import { friendlyValue } from "../lib/qr";
import type { ProjectState, ScanProof } from "../types";
import { buttonPrimary, buttonSecondary } from "./ui";

interface Props {
  state: ProjectState;
  content: string;
  status: "new" | "saved" | "edited";
  onName: (name: string) => void;
  onPng: () => void;
  onSvg: () => void;
  onCopy: () => void;
  onSave: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function PreviewPanel({ state, content, status, onName, onPng, onSvg, onCopy, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, content, {
      width: 800,
      margin: state.margin,
      errorCorrectionLevel: state.level,
      color: { dark: state.dark, light: state.light },
    }).catch(() => undefined);
  }, [content, state.dark, state.light, state.level, state.margin]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label="Code name"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1.5 py-1 text-base font-semibold text-ink outline-none transition hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-mint/40"
          maxLength={40}
          value={state.name}
          placeholder="Untitled code"
          onChange={(e) => onName(e.target.value)}
        />
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            status === "saved" ? "bg-mint/20 text-emerald-800" : status === "edited" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          {status === "saved" ? "Saved" : status === "edited" ? "Unsaved changes" : "Not saved"}
        </span>
      </div>

      {/* Solid white plate: never glass, so the code always scans. */}
      <div className="mt-3 flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <canvas
          ref={canvasRef}
          className="block aspect-square !h-auto !w-full max-w-[400px] rounded-md"
          style={{ background: state.light }}
          aria-label={`QR code for ${friendlyValue(state)}`}
          role="img"
        />
      </div>
      <p className="mt-2 truncate px-1.5 text-center text-xs text-slate-400" title={friendlyValue(state)}>
        {friendlyValue(state)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onPng} className={`${buttonPrimary} py-3.5 text-[15px]`}>
          <Download className="h-[18px] w-[18px]" />
          <span>
            <span className="hidden min-[420px]:inline">Download </span>
            PNG
          </span>
        </button>
        <button type="button" onClick={onSvg} className="inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-[#4fd99a] active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">
          <Download className="h-[18px] w-[18px]" />
          <span>
            <span className="hidden min-[420px]:inline">Download </span>
            SVG
          </span>
        </button>
      </div>
      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <button type="button" onClick={onCopy} className={buttonSecondary} title="Copy image to clipboard">
          <ClipboardCopy className="h-4 w-4" />
          Copy
        </button>
        <button type="button" onClick={onSave} className={buttonSecondary}>
          <Save className="h-4 w-4 text-emerald-600" />
          <span className="truncate">{status === "edited" ? "Save changes" : status === "saved" ? "Saved" : "Save to My codes"}</span>
          <kbd className="ml-auto hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 font-sans text-[11px] font-medium text-slate-400 sm:inline">{isMac ? "⌘" : "Ctrl"} S</kbd>
        </button>
      </div>
    </div>
  );
}

export function ScanProofTile({ scanProof }: { scanProof: ScanProof }) {
  const tone =
    scanProof.score >= 90
      ? { text: "text-emerald-700", bar: "bg-emerald-500" }
      : scanProof.score >= 72
        ? { text: "text-amber-700", bar: "bg-amber-500" }
        : { text: "text-rose-700", bar: "bg-rose-500" };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end justify-between">
        <div>
          <span className={`text-sm font-semibold ${tone.text}`}>{scanProof.grade}</span>
          <p className="text-xs text-slate-400">{scanProof.contrast_ratio}:1 contrast</p>
        </div>
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-ink">
          {scanProof.score}
          <span className="text-base font-medium text-slate-300">/100</span>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${tone.bar}`} style={{ width: `${scanProof.score}%` }} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {scanProof.recommendations.slice(0, 3).map((tip) => (
          <li key={tip} className="flex gap-1.5 text-[13px] leading-5 text-slate-600">
            {scanProof.score >= 90 ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <AlertCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone.text}`} />}
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
