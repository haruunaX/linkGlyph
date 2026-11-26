import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Check, ClipboardCopy, Download, Save } from "lucide-react";
import { friendlyValue } from "../lib/qr";
import type { ProjectState, ScanProof } from "../types";
import { buttonPrimary, buttonSecondary, card } from "./ui";

interface Props {
  state: ProjectState;
  content: string;
  scanProof: ScanProof;
  status: "new" | "saved" | "edited";
  onName: (name: string) => void;
  onPng: () => void;
  onSvg: () => void;
  onCopy: () => void;
  onSave: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function PreviewPanel({ state, content, scanProof, status, onName, onPng, onSvg, onCopy, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, content, {
      width: 640,
      margin: state.margin,
      errorCorrectionLevel: state.level,
      color: { dark: state.dark, light: state.light },
    }).catch(() => undefined);
  }, [content, state.dark, state.light, state.level, state.margin]);

  const tone =
    scanProof.score >= 90
      ? { dot: "bg-emerald-500", text: "text-emerald-700", bar: "bg-emerald-500" }
      : scanProof.score >= 72
        ? { dot: "bg-amber-500", text: "text-amber-700", bar: "bg-amber-500" }
        : { dot: "bg-rose-500", text: "text-rose-700", bar: "bg-rose-500" };

  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label="Code name"
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 text-[15px] font-semibold text-ink outline-none transition hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-mint/40"
          maxLength={40}
          value={state.name}
          placeholder="Untitled code"
          onChange={(e) => onName(e.target.value)}
        />
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            status === "saved" ? "bg-emerald-50 text-emerald-700" : status === "edited" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {status === "saved" ? "Saved" : status === "edited" ? "Unsaved changes" : "Not saved"}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/80 p-6 transition-colors duration-300" style={{ background: state.light }}>
        <canvas ref={canvasRef} className="mx-auto block aspect-square !h-auto !w-full max-w-[300px]" aria-label="Generated QR code" role="img" />
      </div>
      <p className="mt-2 truncate px-1 text-xs text-slate-400" title={friendlyValue(state)}>
        {friendlyValue(state)}
      </p>

      <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3">
        <div className="flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <i className={`h-2 w-2 rounded-full ${tone.dot}`} />
            Scan Proof
            <span className={tone.text}>{scanProof.grade}</span>
          </span>
          <span className="tabular-nums font-semibold text-ink">{scanProof.score}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full transition-all duration-500 ${tone.bar}`} style={{ width: `${scanProof.score}%` }} />
        </div>
        <p className="mt-2 flex gap-1.5 text-xs leading-5 text-slate-500">
          {scanProof.score >= 90 && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />}
          {scanProof.recommendations[0]}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
        <button type="button" onClick={onPng} className={buttonPrimary}>
          <Download className="h-4 w-4" />
          Download PNG
        </button>
        <button type="button" onClick={onSvg} className={buttonSecondary}>
          SVG
        </button>
        <button type="button" onClick={onCopy} className={`${buttonSecondary} px-3`} aria-label="Copy image" title="Copy image">
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <button type="button" onClick={onSave} className={`${buttonSecondary} mt-2 w-full`}>
        <Save className="h-4 w-4 text-emerald-600" />
        {status === "edited" ? "Save changes" : status === "saved" ? "Saved to My codes" : "Save to My codes"}
        <kbd className="ml-auto hidden rounded border border-slate-200 bg-slate-50 px-1.5 font-sans text-[11px] text-slate-400 sm:inline">{isMac ? "⌘" : "Ctrl"} S</kbd>
      </button>
    </div>
  );
}
