import type { ProjectState } from "../types";

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

export function safeFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "linkglyph-qr"
  );
}
