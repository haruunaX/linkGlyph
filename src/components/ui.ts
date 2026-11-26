// Flat design tokens: borders instead of shadows, solid fills, one accent.
export const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-ink focus:bg-white focus:ring-4 focus:ring-mint/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export const label = "block text-[13px] font-medium text-slate-600";

/** Flat bento tile. */
export const tile = "rounded-2xl border border-slate-200/90 bg-white";

/** Kept for components that still import `card`. */
export const card = tile;

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40";

export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-slate-300 hover:bg-slate-50 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40";

export const iconButton =
  "grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint";

/** Frosted glass shell. Only used around the generator. */
export const glass =
  "rounded-[28px] border border-white/70 bg-white/45 p-2.5 ring-1 ring-slate-900/[.04] backdrop-blur-2xl backdrop-saturate-150 sm:p-3";
