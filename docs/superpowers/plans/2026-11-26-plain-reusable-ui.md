# Plain Reusable UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketing-style page with a single-screen, quiet, premium QR tool that has an always-visible saved-codes library.

**Architecture:** Pure localStorage logic moves into `src/lib/storage.ts`, which is unit-tested with Vitest. `App.tsx` becomes a thin shell that holds state and wires focused components in `src/components/`. The backend is untouched.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind 4, `qrcode`, lucide-react, Vitest (new dev dependency).

**Spec:** `docs/superpowers/specs/2026-11-26-plain-reusable-ui-design.md`

## Global Constraints
- No database, accounts, or backend changes.
- Library key stays `linkglyph-projects`, and existing entries must still load. Draft key is `linkglyph-draft`.
- Library cap is 50. The search box appears when the library has more than 6 codes.
- Palette: white / slate-50 surfaces, ink `#0B1220` text, mint `#5EE6A8` as the only accent. Font: Inter only (drop Space Grotesk).
- Keep the five content types, the four presets, Scan Proof (API → browser fallback), and PNG/SVG export.

## Review Focus
- Corrupt or non-array JSON in either key → app loads with empty library / defaults, no crash.
- Old saved entries missing newer fields → merged over `defaults` on load.
- Clipboard image copy unsupported (Firefox/insecure context) → toast says so instead of throwing.
- Ctrl/Cmd+S while focus is in an input → saves and prevents the browser's "save page" dialog.
- Saving the 51st code → oldest dropped, list stays at 50.

---

### Task 1: Storage module with tests

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`
- Modify: `package.json` (add `vitest` devDependency, `"test": "vitest run"` script)

**Interfaces:**
- Produces:
  - `LIBRARY_LIMIT = 50`
  - `readLibrary(store?: Storage): SavedProject[]`. Returns `[]` on bad or non-array JSON, and merges each entry over `defaults` (including `fields`).
  - `writeLibrary(list: SavedProject[], store?: Storage): void`
  - `addToLibrary(list: SavedProject[], project: SavedProject): SavedProject[]`. Prepends the project and truncates the list to 50.
  - `duplicateInLibrary(list: SavedProject[], id: string): SavedProject[]`. Inserts the copy right after the original, with a new id, `name + " copy"`, and a fresh `savedAt`.
  - `renameInLibrary(list: SavedProject[], id: string, name: string): SavedProject[]`. Trims the name and slices it to 40 characters. An empty name keeps the old one.
  - `readDraft(store?: Storage): ProjectState | null` / `writeDraft(state: ProjectState, store?: Storage): void`

- [ ] Step 1: Write tests in `storage.test.ts` using an in-memory `Storage` stub: corrupt JSON → `[]`; `{}` → `[]`; legacy entry `{id,name,type:"url",fields:{url:"x"}}` → has `fields.ssid === ""` and `margin === 4`; adding to a 50-item list → length 50 and new item first; duplicate → length+1, copy at index+1, name ends with " copy", different id; rename "  " → name unchanged; rename to a 60-char string → length 40; draft round-trip equals input; corrupt draft → `null`.
- [ ] Step 2: `npm i -D vitest && npx vitest run` → FAIL (module missing).
- [ ] Step 3: Implement `src/lib/storage.ts`.
- [ ] Step 4: `npm test` → all pass.
- [ ] Step 5: Commit `feat: add tested localStorage library module`.

### Task 2: Components and new App shell

**Files:**
- Create: `src/components/Header.tsx`, `ContentForm.tsx`, `StylePanel.tsx`, `PreviewPanel.tsx`, `Library.tsx`, `QrThumb.tsx`, `Toast.tsx`, `ui.ts` (shared class strings)
- Modify: `src/App.tsx` (full rewrite), `src/index.css`, `index.html` (title "LinkGlyph — QR code studio", theme-color `#ffffff`)

**Interfaces:**
- Consumes: Task 1 storage functions; `buildQrContent`, `friendlyValue`, `browserScanProof`, `safeFilename`, `defaults` from `lib/qr.ts`.
- Produces (props):
  - `ContentForm({ state, onChange: (s: ProjectState) => void })`
  - `StylePanel({ state, onChange })`. Includes the presets, the two color inputs, and an `<details>` "Advanced" section with size, error correction, and quiet zone.
  - `PreviewPanel({ state, content, scanProof, onName, onPng, onSvg, onCopy, onSave })`
  - `Library({ items, activeId, onLoad, onRename, onDuplicate, onDelete })`. Has a search box when `items.length > 6`, inline rename, and empty state.
  - `QrThumb({ project })`. Renders the code to a small canvas with `qrcode`, at 56px.

- [ ] Step 1: Build the components and the App shell. App behaviour: initial state = `readDraft() ?? defaults`; `writeDraft` debounced 300ms on change; the Scan Proof fetch logic is unchanged from the current App; Ctrl/Cmd+S → `preventDefault` + save; copy uses `navigator.clipboard.write([new ClipboardItem({"image/png": blob})])` and shows the toast "Copying images isn't supported in this browser" on failure. Layout: `lg:grid-cols-[1fr_400px]`, with the preview `lg:sticky lg:top-6`. On mobile the preview renders first (`order-first lg:order-none`). The library is a full-width section below the editor.
- [ ] Step 2: `npm run build` → succeeds with no type errors. `npm test` → passes.
- [ ] Step 3: Run `npm run dev` and check in a browser at desktop and 375px widths: type switching, presets, Advanced toggle, save → appears in the library, load, rename, duplicate, delete, search (after 7 items), reload keeps the draft, Ctrl+S saves.
- [ ] Step 4: Commit `feat: plain reusable single-screen UI`.
