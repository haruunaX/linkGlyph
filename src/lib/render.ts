import QRCode from "qrcode";
import type { ProjectState } from "../types";

/** Caption geometry, relative to the code's full width (quiet zone included). */
const FONT_RATIO = 0.07;
const BAND_RATIO = 2.1; // band height = font size × this
const MAX_TEXT_WIDTH = 0.88; // text may use up to this share of the width
const FONT_STACK = `Inter, "Segoe UI", system-ui, sans-serif`;

/** The caption to draw, or null when it's switched off or empty. */
export function captionText(state: Pick<ProjectState, "showCaption" | "caption">): string | null {
  if (!state.showCaption) return null;
  const text = state.caption.trim();
  return text ? text : null;
}

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]!);

/** Extends an SVG QR code with a band below it holding centered caption text. */
export function addCaptionToSvg(svg: string, text: string, color: string, background: string): string {
  const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!match) return svg;
  const width = Number(match[1]);
  const height = Number(match[2]);
  // Rough width estimate (average glyph ≈ 0.56em) so long captions shrink to fit.
  const fitted = (width * MAX_TEXT_WIDTH) / Math.max(1, text.length * 0.56);
  const fontSize = Math.min(width * FONT_RATIO, fitted);
  const band = width * FONT_RATIO * BAND_RATIO;
  const round = (n: number) => Number(n.toFixed(3));
  const caption =
    `<rect x="0" y="${height}" width="${width}" height="${round(band)}" fill="${background}"/>` +
    `<text x="${round(width / 2)}" y="${round(height + band * 0.42)}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family='${FONT_STACK}' font-weight="600" font-size="${round(fontSize)}" fill="${color}" shape-rendering="geometricPrecision">${escapeXml(text)}</text>`;
  return svg
    .replace(match[0], `viewBox="0 0 ${width} ${round(height + band)}"`)
    .replace(/<\/svg>\s*$/, `${caption}</svg>\n`);
}

const qrOptions = (state: ProjectState) => ({
  margin: state.margin,
  errorCorrectionLevel: state.level,
  color: { dark: state.dark, light: state.light },
});

/** Renders the code (plus caption, if on) to a canvas `width` pixels wide. */
export async function renderCanvas(state: ProjectState, content: string, width: number): Promise<HTMLCanvasElement> {
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, content, { ...qrOptions(state), width });
  const text = captionText(state);
  if (!text) return qr;

  await document.fonts?.ready;
  const band = Math.round(qr.width * FONT_RATIO * BAND_RATIO);
  const out = document.createElement("canvas");
  out.width = qr.width;
  out.height = qr.height + band;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = state.light;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(qr, 0, 0);

  let fontSize = Math.round(qr.width * FONT_RATIO);
  const font = (px: number) => `600 ${px}px ${FONT_STACK}`;
  ctx.font = font(fontSize);
  while (fontSize > 8 && ctx.measureText(text).width > qr.width * MAX_TEXT_WIDTH) {
    fontSize -= 1;
    ctx.font = font(fontSize);
  }
  ctx.fillStyle = state.dark;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, qr.width / 2, qr.height + band * 0.42);
  return out;
}

/** The SVG export, with the caption added when it's on. */
export async function renderSvg(state: ProjectState, content: string): Promise<string> {
  const svg = await QRCode.toString(content, { ...qrOptions(state), type: "svg" });
  const text = captionText(state);
  return text ? addCaptionToSvg(svg, text, state.dark, state.light) : svg;
}
