# LinkGlyph: plain, reusable UI redesign

## Intent
The user wants LinkGlyph to be "a plain reusable website": a clean, premium-feeling
tool you open, make a QR code with, and come back to. It shouldn't feel like a
marketing page. No database for now.

## Goals
- The tool fills the page: the editor is visible on load, with no hero section or feature cards.
- A quiet, refined look: white/light-gray surfaces, ink text, one mint accent,
  Inter only, thin borders, soft shadows, and subtle transitions.
- Two columns: form on the left, sticky preview and actions on the right. On mobile the preview sits on top.
- Size, error correction, and quiet zone sit in a collapsible "Advanced" section.
- "My codes" is always visible (not a drawer). Each item shows a mini QR thumbnail and
  can be loaded, renamed, duplicated, or deleted. The list holds up to 50 codes, and a search box appears once it has more than 6.
- Reuse conveniences: restore the last session on return, save with Ctrl/Cmd+S,
  and copy the image to the clipboard.

## Non-goals
- A database, accounts, or sync.
- New QR visual styles (dots, logos, gradients).
- Backend changes.

## Keep unchanged
The five content types, the color presets, Scan Proof (API with a browser fallback,
shown compactly under the preview), PNG/SVG export, and browser-only saving
(the existing `linkglyph-projects` localStorage key, so existing saves carry over).

## Approaches
1. **Tool-first single screen (chosen).** Matches "plain reusable": no marketing,
   and saved codes always within reach.
2. Keep the landing-page structure with a lighter restyle. Rejected because the hero and feature
   sections are exactly the non-plain parts.

## Builder's calls
- Split `App.tsx` into small components (`components/`).
- Session restore uses a separate key, `linkglyph-draft`.
- Remove the Space Grotesk font import.
