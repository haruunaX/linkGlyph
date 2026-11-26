import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { AlertCircle, Check, ClipboardCopy, Download } from "lucide-react";
import { friendlyValue } from "../lib/qr";
import { prefersReducedMotion, useCountUp } from "../lib/motion";
import type { ProjectState, ScanProof } from "../types";
import { buttonPrimary, buttonSecondary } from "./ui";

interface Props {
  state: ProjectState;
  content: string;
  onName: (name: string) => void;
  onPng: () => void;
  onSvg: () => void;
  onCopy: () => void;
}

const downloadIcon = "h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5";

export function PreviewPanel({ state, content, onName, onPng, onSvg, onCopy }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);
  const firstDraw = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, content, {
      width: 900,
      margin: state.margin,
      errorCorrectionLevel: state.level,
      color: { dark: state.dark, light: state.light },
    }).catch(() => undefined);

    if (firstDraw.current || prefersReducedMotion()) {
      firstDraw.current = false;
      return;
    }
    // A quick "pop" on every change, then one scan sweep once edits settle.
    canvas.animate([{ transform: "scale(.975)", opacity: 0.75 }, { transform: "scale(1)", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" });
    const timer = window.setTimeout(() => {
      scanRef.current?.animate(
        [
          { top: "0%", opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { opacity: 1, offset: 0.88 },
          { top: "100%", opacity: 0 },
        ],
        { duration: 1100, easing: "ease-in-out" },
      );
    }, 450);
    return () => window.clearTimeout(timer);
  }, [content, state.dark, state.light, state.level, state.margin]);

  return (
    <div className="flex h-full flex-col">
      <input
        aria-label="Code name"
        className="w-full rounded-lg bg-transparent px-2 py-1.5 text-lg font-semibold text-ink outline-none transition hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-mint/40"
        maxLength={40}
        value={state.name}
        placeholder="Untitled code"
        onChange={(e) => onName(e.target.value)}
      />

      {/* Solid white plate: never glass, so the code always scans. */}
      <div className="mt-3 flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 lg:p-3 xl:p-7">
        <div className="relative w-full max-w-[460px] overflow-hidden rounded-md">
          <canvas
            ref={canvasRef}
            className="block aspect-square !h-auto !w-full"
            style={{ background: state.light }}
            aria-label={`QR code for ${friendlyValue(state)}`}
            role="img"
          />
          <span ref={scanRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-full bg-mint opacity-0 shadow-[0_0_18px_4px_rgba(94,230,168,.65)]" />
        </div>
      </div>
      <p className="mt-2.5 truncate px-2 text-center text-sm text-slate-400" title={friendlyValue(state)}>
        {friendlyValue(state)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onPng} className={`${buttonPrimary} py-4`}>
          <Download className={downloadIcon} />
          <span>
            <span className="hidden min-[420px]:inline">Download </span>
            PNG
          </span>
        </button>
        <button
          type="button"
          onClick={onSvg}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-5 py-4 text-base font-semibold text-ink transition hover:bg-[#4fd99a] active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <Download className={downloadIcon} />
          <span>
            <span className="hidden min-[420px]:inline">Download </span>
            SVG
          </span>
        </button>
      </div>
      <button type="button" onClick={onCopy} className={`${buttonSecondary} mt-2.5 w-full`}>
        <ClipboardCopy className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-rotate-6" />
        Copy image
      </button>
    </div>
  );
}

export function ScanProofTile({ scanProof }: { scanProof: ScanProof }) {
  const shown = useCountUp(scanProof.score);
  const tone =
    scanProof.score >= 90
      ? { text: "text-emerald-700", bar: "bg-emerald-500" }
      : scanProof.score >= 72
        ? { text: "text-amber-700", bar: "bg-amber-500" }
        : { text: "text-rose-700", bar: "bg-rose-500" };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className={`text-base font-semibold ${tone.text}`}>{scanProof.grade}</span>
          <p className="text-sm text-slate-400">{scanProof.contrast_ratio}:1 contrast</p>
        </div>
        <span className="text-5xl font-semibold tabular-nums tracking-tight text-ink" aria-label={`Score ${scanProof.score} out of 100`}>
          {shown}
          <span className="text-lg font-medium text-slate-300">/100</span>
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${tone.bar}`} style={{ width: `${scanProof.score}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {scanProof.recommendations.slice(0, 3).map((tip) => (
          <li key={tip} className="flex animate-[fade-in_.35s_ease-out] gap-2 text-[15px] leading-6 text-slate-600">
            {scanProof.score >= 90 ? <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className={`mt-1 h-4 w-4 shrink-0 ${tone.text}`} />}
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
