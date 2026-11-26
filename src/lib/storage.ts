import { defaults } from "./qr";
import type { ProjectState } from "../types";

export const DRAFT_KEY = "linkglyph-draft";

export interface Draft {
  state: ProjectState;
}

function browserStore(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function withDefaults(value: Partial<ProjectState>): ProjectState {
  const { type, fields, dark, light, size, level, margin, name, showCaption, caption } = { ...structuredClone(defaults), ...value };
  return { type, dark, light, size, level, margin, name, showCaption: Boolean(showCaption), caption: String(caption ?? ""), fields: { ...structuredClone(defaults.fields), ...(fields ?? {}) } };
}

/** The code in progress, so a reload doesn't lose it. Returns null if missing or unreadable. */
export function readDraft(store: Storage | undefined = browserStore()): Draft | null {
  try {
    const data = JSON.parse(store?.getItem(DRAFT_KEY) ?? "null") as { state?: unknown } | null;
    if (!data || typeof data !== "object" || !data.state || typeof data.state !== "object") return null;
    return { state: withDefaults(data.state as Partial<ProjectState>) };
  } catch {
    return null;
  }
}

export function writeDraft(draft: Draft, store: Storage | undefined = browserStore()): void {
  try {
    store?.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}
