import { defaults } from "./qr";
import type { ProjectState, SavedProject } from "../types";

export const LIBRARY_KEY = "linkglyph-projects";
export const DRAFT_KEY = "linkglyph-draft";
export const LIBRARY_LIMIT = 50;

function browserStore(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function readJson(key: string, store = browserStore()): unknown {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown, store = browserStore()): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export function withDefaults<T extends Partial<ProjectState>>(value: T): ProjectState & T {
  return {
    ...structuredClone(defaults),
    ...value,
    fields: { ...structuredClone(defaults.fields), ...(value.fields ?? {}) },
  };
}

export function readLibrary(store?: Storage): SavedProject[] {
  const data = readJson(LIBRARY_KEY, store ?? browserStore());
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is SavedProject => !!item && typeof item === "object" && typeof item.id === "string")
    .map((item) => withDefaults(item));
}

export function writeLibrary(list: SavedProject[], store?: Storage): void {
  writeJson(LIBRARY_KEY, list, store ?? browserStore());
}

export function addToLibrary(list: SavedProject[], project: SavedProject): SavedProject[] {
  return [project, ...list].slice(0, LIBRARY_LIMIT);
}

export function saveToLibrary(list: SavedProject[], project: SavedProject): SavedProject[] {
  return addToLibrary(
    list.filter((item) => item.id !== project.id),
    project,
  );
}

export function duplicateInLibrary(list: SavedProject[], id: string): SavedProject[] {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return list;
  const original = list[index];
  const copy: SavedProject = {
    ...structuredClone(original),
    id: crypto.randomUUID(),
    name: `${original.name} copy`.slice(0, 40),
    savedAt: new Date().toISOString(),
  };
  return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)].slice(0, LIBRARY_LIMIT);
}

export function renameInLibrary(list: SavedProject[], id: string, name: string): SavedProject[] {
  const clean = name.trim().slice(0, 40);
  if (!clean) return list;
  return list.map((item) => (item.id === id ? { ...item, name: clean } : item));
}

export interface Draft {
  state: ProjectState;
  activeId: string | null;
}

export function readDraft(store?: Storage): Draft | null {
  const data = readJson(DRAFT_KEY, store ?? browserStore()) as Partial<{ state: unknown; activeId: unknown }> | null;
  if (!data || typeof data !== "object" || !data.state || typeof data.state !== "object") return null;
  return {
    state: withDefaults(data.state as Partial<ProjectState>),
    activeId: typeof data.activeId === "string" ? data.activeId : null,
  };
}

export function writeDraft(draft: Draft, store?: Storage): void {
  writeJson(DRAFT_KEY, draft, store ?? browserStore());
}
