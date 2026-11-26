import { useEffect, useRef } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import { friendlyValue } from "../lib/qr";
import { renderCanvas } from "../lib/render";
import { prefersReducedMotion } from "../lib/motion";
import type { ProjectState } from "../types";
import { buttonPrimary, buttonSecondary } from "./ui";

interface Props {
  state: ProjectState;
  content: string;
  onName: (name: string) => void;
  onPng: () => void;
  onSvg: () => void;
  onCopy: () => void;
}

const downloadIcon = "h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-y-0.5";

export function PreviewPanel({ state, content, onName, onPng, onSvg, onCopy }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const firstDraw = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    renderCanvas(state, content, 800)
      .then((src) => {
        if (cancelled) return;
        canvas.width = src.width;
        canvas.height = src.height;
        canvas.getContext("2d")?.drawImage(src, 0, 0);
      })
      .catch(() => undefined);

    if (firstDraw.current || prefersReducedMotion()) {
      firstDraw.current = false;
      return () => {
        cancelled = true;
      };
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
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [content, state.dark, state.light, state.level, state.margin, state.showCaption, state.caption]);

  // Subtle 3D tilt toward the pointer (mouse/pen only).
  const onTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || event.pointerType === "touch" || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
  };
  const resetTilt = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };

  return (
    <div className="flex h-full flex-col">
      <input
        aria-label="Code name"
        className="w-full rounded-lg bg-transparent px-2 py-1 text-[15px] font-semibold text-ink outline-none transition hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-mint/40 sm:text-base"
        maxLength={40}
        value={state.name}
        placeholder="Untitled code"
        onChange={(e) => onName(e.target.value)}
      />

      {/* Solid white plate: never glass, so the code always scans. */}
      <div className="mt-2.5 flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 lg:p-3" onPointerMove={onTilt} onPointerLeave={resetTilt}>
        <div ref={tiltRef} className={`relative w-full max-w-[300px] overflow-hidden rounded-md transition-transform duration-200 ease-out will-change-transform ${
            // With a caption the image is ~15% taller, so trim its width on short screens to keep the same height.
            state.showCaption ? "lg:max-w-[min(340px,calc((100vh-460px)*0.86))]" : "lg:max-w-[min(340px,calc(100vh-460px))]"
          }`}>
          <canvas
            ref={canvasRef}
            className="block !h-auto !w-full"
            style={{ background: state.light }}
            aria-label={`QR code for ${friendlyValue(state)}`}
            role="img"
          />
          <span ref={scanRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-full bg-mint opacity-0 shadow-[0_0_18px_4px_rgba(94,230,168,.65)]" />
        </div>
      </div>
      <p className="mt-2 truncate px-2 text-center text-[13px] text-slate-400" title={friendlyValue(state)}>
        {friendlyValue(state)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onPng} className={buttonPrimary}>
          <Download className={downloadIcon} />
          <span>
            <span className="hidden min-[420px]:inline">Download </span>
            PNG
          </span>
        </button>
        <button
          type="button"
          onClick={onSvg}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-[15px] font-semibold text-ink transition hover:bg-[#4fd99a] active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <Download className={downloadIcon} />
          <span>
            <span className="hidden min-[420px]:inline">Download </span>
            SVG
          </span>
        </button>
      </div>
      <button type="button" onClick={onCopy} className={`${buttonSecondary} mt-2 w-full`}>
        <ClipboardCopy className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-rotate-6" />
        Copy image
      </button>
    </div>
  );
}
