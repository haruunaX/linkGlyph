export type QrType = "url" | "text" | "email" | "phone" | "wifi";
export type ErrorLevel = "L" | "M" | "Q" | "H";

export interface QrFields {
  url: string;
  text: string;
  email: string;
  subject: string;
  body: string;
  phone: string;
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
}

export interface ProjectState {
  type: QrType;
  fields: QrFields;
  dark: string;
  light: string;
  size: number;
  level: ErrorLevel;
  margin: number;
  name: string;
}

export interface SavedProject extends ProjectState {
  id: string;
  content: string;
  savedAt: string;
}

export interface ScanProof {
  score: number;
  grade: "Excellent" | "Good" | "Needs work";
  contrast_ratio: number;
  recommendations: string[];
  source: "python" | "browser";
}
