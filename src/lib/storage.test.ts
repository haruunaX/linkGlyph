import { describe, expect, it } from "vitest";
import { readDraft, writeDraft } from "./storage";
import { defaults } from "./qr";

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

describe("draft", () => {
  it("round-trips", () => {
    const store = memoryStore();
    const state = { ...structuredClone(defaults), name: "Draft" };
    writeDraft({ state }, store);
    expect(readDraft(store)).toEqual({ state });
  });

  it("fills missing fields from defaults", () => {
    const store = memoryStore({ "linkglyph-draft": JSON.stringify({ state: { name: "Old", fields: { url: "x" } } }) });
    const draft = readDraft(store);
    expect(draft?.state.name).toBe("Old");
    expect(draft?.state.fields.url).toBe("x");
    expect(draft?.state.fields.ssid).toBe("");
    expect(draft?.state.margin).toBe(4);
  });

  it("drops unknown keys from older drafts", () => {
    const store = memoryStore({ "linkglyph-draft": JSON.stringify({ state: { name: "Old" }, activeId: "a" }) });
    expect(readDraft(store)).toEqual({ state: { ...structuredClone(defaults), name: "Old" } });
  });

  it("returns null for corrupt or missing drafts", () => {
    expect(readDraft(memoryStore({ "linkglyph-draft": "nope" }))).toBeNull();
    expect(readDraft(memoryStore())).toBeNull();
    expect(readDraft(memoryStore({ "linkglyph-draft": "[]" }))).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    expect(readDraft(undefined)).toBeNull();
    expect(() => writeDraft({ state: structuredClone(defaults) }, undefined)).not.toThrow();
  });
});
