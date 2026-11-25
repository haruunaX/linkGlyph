import type { ProjectState, ScanProof } from "../types";

export const defaults: ProjectState = {
  type: "url",
  fields: {
    url: "https://linkglyph.app",
    text: "Hello from LinkGlyph",
    email: "",
    subject: "",
    body: "",
    phone: "",
    ssid: "",
    password: "",
    encryption: "WPA",
  },
  dark: "#0B1220",
  light: "#FFFFFF",
  size: 1024,
  level: "M",
  margin: 4,
  name: "My first glyph",
};

const wifiEscape = (value: string) => value.replace(/([\\;,":])/g, "\\$1");

export function buildQrContent(state: ProjectState): string {
  const fields = state.fields;
  if (state.type === "url") {
    const raw = fields.url.trim() || "https://linkglyph.app";
    return /^(https?:\/\/)/i.test(raw) ? raw : `https://${raw}`;
  }
  if (state.type === "text") return fields.text.trim() || "Hello from LinkGlyph";
  if (state.type === "email") {
    const params = new URLSearchParams();
    if (fields.subject.trim()) params.set("subject", fields.subject.trim());
    if (fields.body.trim()) params.set("body", fields.body.trim());
    const query = params.toString();
    return `mailto:${fields.email.trim() || "hello@example.com"}${query ? `?${query}` : ""}`;
  }
  if (state.type === "phone") {
    return `tel:${fields.phone.trim().replace(/[^+\d]/g, "") || "+639123456789"}`;
  }
  return `WIFI:T:${fields.encryption};S:${wifiEscape(fields.ssid || "My Wi-Fi")};P:${
    fields.encryption === "nopass" ? "" : wifiEscape(fields.password)
  };H:false;;`;
}

export function friendlyValue(state: ProjectState): string {
  if (state.type === "url") return state.fields.url || "https://linkglyph.app";
  if (state.type === "text") return state.fields.text || "Plain text";
  if (state.type === "email") return state.fields.email || "hello@example.com";
  if (state.type === "phone") return state.fields.phone || "+63 912 345 6789";
  return state.fields.ssid || "My Wi-Fi";
}

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function browserScanProof(state: ProjectState, content: string): ScanProof {
  const ratio = contrastRatio(state.dark, state.light);
  let score = 100;
  const recommendations: string[] = [];

  if (ratio < 4.5) {
    score -= ratio < 3 ? 42 : 24;
    recommendations.push("Increase contrast between the code and its background.");
  }
  if (state.margin < 4) {
    score -= 18;
    recommendations.push("Use a quiet zone of at least 4 modules for reliable scanning.");
  }
  if (content.length > 500) {
    score -= 16;
    recommendations.push("Shorten the content or use a redirect URL to reduce QR density.");
  } else if (content.length > 220) {
    score -= 8;
    recommendations.push("This is a dense code; test it at the final print size.");
  }
  if (state.size < 512) {
    score -= 10;
    recommendations.push("Export at 512 px or larger for sharper results.");
  }
  if (!recommendations.length) recommendations.push("Strong contrast and spacing — ready for a real-device scan test.");

  score = Math.max(0, score);
  return {
    score,
    grade: score >= 90 ? "Excellent" : score >= 72 ? "Good" : "Needs work",
    contrast_ratio: Number(ratio.toFixed(2)),
    recommendations,
    source: "browser",
  };
}

export function safeFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "linkglyph-qr"
  );
}
