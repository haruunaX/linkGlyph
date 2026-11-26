import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { buildQrContent } from "../lib/qr";
import type { ProjectState } from "../types";

export function QrThumb({ project, className = "h-14 w-14" }: { project: ProjectState; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const content = buildQrContent(project);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, content, {
      width: 112,
      margin: 1,
      errorCorrectionLevel: project.level,
      color: { dark: project.dark, light: project.light },
    }).catch(() => undefined);
  }, [content, project.dark, project.light, project.level]);

  return (
    <span className={`block shrink-0 overflow-hidden rounded-lg border border-slate-200 ${className}`} style={{ background: project.light }}>
      <canvas ref={ref} className="!h-full !w-full" aria-hidden="true" />
    </span>
  );
}
