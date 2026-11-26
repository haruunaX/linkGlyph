import { describe, expect, it } from "vitest";
import {
  LIBRARY_LIMIT,
  addToLibrary,
  saveToLibrary,
  duplicateInLibrary,
  readDraft,
  readLibrary,
  renameInLibrary,
  writeDraft,
  writeLibrary,
} from "./storage";
import { defaults } from "./qr";
import type { SavedProject } from "../types";

function memoryStore(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

function project(id: string, name = `Code ${id}`): SavedProject {
  return { ...structuredClone(defaults), id, name, content: "x", savedAt: "2026-01-01T00:00:00.000Z" };
}

describe("readLibrary", () => {
  it("returns [] for corrupt JSON", () => {
    expect(readLibrary(memoryStore({ "linkglyph-projects": "{oops" }))).toEqual([]);
  });

  it("returns [] for non-array JSON", () => {
    expect(readLibrary(memoryStore({ "linkglyph-projects": "{}" }))).toEqual([]);
  });

  it("merges legacy entries over defaults", () => {
    const legacy = JSON.stringify([{ id: "a", name: "Old", type: "url", fields: { url: "x" } }]);
    const [item] = readLibrary(memoryStore({ "linkglyph-projects": legacy }));
    expect(item.fields.url).toBe("x");
    expect(item.fields.ssid).toBe("");
    expect(item.margin).toBe(4);
  });

  it("round-trips through writeLibrary", () => {
    const store = memoryStore();
    writeLibrary([project("a")], store);
    expect(readLibrary(store).map((p) => p.id)).toEqual(["a"]);
  });
});

describe("library operations", () => {
  it("caps the library at the limit with newest first", () => {
    const full = Array.from({ length: LIBRARY_LIMIT }, (_, i) => project(String(i)));
    const next = addToLibrary(full, project("new"));
    expect(LIBRARY_LIMIT).toBe(50);
    expect(next).toHaveLength(50);
    expect(next[0].id).toBe("new");
  });

  it("saveToLibrary replaces an existing id and moves it to the front", () => {
    const list = [project("a"), project("b")];
    const next = saveToLibrary(list, { ...project("b"), name: "Edited" });
    expect(next.map((p) => p.id)).toEqual(["b", "a"]);
    expect(next[0].name).toBe("Edited");
  });

  it("saveToLibrary adds unknown ids to the front", () => {
    expect(saveToLibrary([project("a")], project("c")).map((p) => p.id)).toEqual(["c", "a"]);
  });

  it("duplicates right after the original", () => {
    const list = [project("a"), project("b", "Menu")];
    const next = duplicateInLibrary(list, "b");
    expect(next).toHaveLength(3);
    expect(next[2].name).toBe("Menu copy");
    expect(next[2].id).not.toBe("b");
  });

  it("ignores blank renames", () => {
    expect(renameInLibrary([project("a", "Keep")], "a", "   ")[0].name).toBe("Keep");
  });

  it("trims long renames to 40 characters", () => {
    expect(renameInLibrary([project("a")], "a", "x".repeat(60))[0].name).toHaveLength(40);
  });
});

describe("draft", () => {
  it("round-trips", () => {
    const store = memoryStore();
    const state = { ...structuredClone(defaults), name: "Draft" };
    writeDraft({ state, activeId: "a" }, store);
    expect(readDraft(store)).toEqual({ state, activeId: "a" });
  });

  it("reads legacy drafts with no activeId", () => {
    const store = memoryStore({ "linkglyph-draft": JSON.stringify({ state: { name: "Old" } }) });
    expect(readDraft(store)?.state.name).toBe("Old");
    expect(readDraft(store)?.activeId).toBeNull();
  });

  it("returns null for corrupt drafts", () => {
    expect(readDraft(memoryStore({ "linkglyph-draft": "nope" }))).toBeNull();
  });
});
