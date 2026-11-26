import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ErrorLevel, ProjectState } from "../types";
import { input, label } from "./ui";

export const presets = [
  { name: "Ink", dark: "#0B1220", light: "#FFFFFF" },
  { name: "Grove", dark: "#194D3C", light: "#EFFFF7" },
  { name: "Iris", dark: "#2C2470", light: "#F1EEFF" },
  { name: "Ember", dark: "#6F2D24", light: "#FFF1E7" },
];

interface Props {
  state: ProjectState;
  onChange: (next: ProjectState) => void;
}

function ColorInput({ title, value, onValue }: { title: string; value: string; onValue: (v: string) => void }) {
  // Keep partial hex text local; only complete #RRGGBB values reach the QR renderer.
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const onText = (next: string) => {
    if (!/^#?[0-9a-f]{0,6}$/i.test(next)) return;
    const normalized = (next.startsWith("#") ? next : `#${next}`).toUpperCase();
    setText(normalized);
    if (normalized.length === 7) onValue(normalized);
  };

  return (
    <label className={label}>
      {title}
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 pr-3 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-mint/30 hover:border-slate-300">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-black/10" style={{ background: value }}>
          <input aria-label={`${title} picker`} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" type="color" value={value} onChange={(e) => onValue(e.target.value.toUpperCase())} />
        </span>
        <input
          aria-label={`${title} hex value`}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase text-ink outline-none"
          value={text}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => onText(e.target.value)}
          onBlur={() => setText(value)}
        />
      </div>
    </label>
  );
}

function Select({ title, value, onValue, options }: { title: string; value: string; onValue: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className={label}>
      {title}
      <div className="relative mt-1.5">
        <select className={`${input} appearance-none pr-10`} value={value} onChange={(e) => onValue(e.target.value)}>
          {options.map(([v, text]) => (
            <option key={v} value={v}>
              {text}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

export function StylePanel({ state, onChange }: Props) {
  const setColor = (key: "dark" | "light", value: string) => onChange({ ...state, [key]: value });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color presets">
        {presets.map((preset) => {
          const active = state.dark === preset.dark && state.light === preset.light;
          return (
            <button
              key={preset.name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ ...state, dark: preset.dark, light: preset.light })}
              className={`group inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
                active ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full border ${active ? "border-white/40" : "border-black/10"}`}
                style={{ background: `linear-gradient(135deg, ${preset.dark} 50%, ${preset.light} 50%)` }}
              />
              {preset.name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorInput title="Code color" value={state.dark} onValue={(v) => setColor("dark", v)} />
        <ColorInput title="Background" value={state.light} onValue={(v) => setColor("light", v)} />
      </div>

      <details className="group rounded-xl border border-slate-200/80 bg-slate-50/60 open:bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint">
          Advanced
          <span className="flex items-center gap-2 text-xs font-normal text-slate-400">
            {state.size}px · {state.level} · margin {state.margin}
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <div className="grid gap-4 border-t border-slate-200/80 px-4 pb-4 pt-4 sm:grid-cols-2">
          <Select
            title="Export size"
            value={String(state.size)}
            onValue={(v) => onChange({ ...state, size: Number(v) })}
            options={[["512", "512 × 512"], ["1024", "1024 × 1024"], ["2048", "2048 × 2048"]]}
          />
          <Select
            title="Error correction"
            value={state.level}
            onValue={(v) => onChange({ ...state, level: v as ErrorLevel })}
            options={[["L", "Low · 7%"], ["M", "Medium · 15%"], ["Q", "Quartile · 25%"], ["H", "High · 30%"]]}
          />
          <label className={`${label} sm:col-span-2`}>
            <span className="flex justify-between">
              Quiet zone<span className="tabular-nums text-slate-400">{state.margin} modules</span>
            </span>
            <input className="range mt-3 w-full" type="range" min={2} max={10} value={state.margin} onChange={(e) => onChange({ ...state, margin: Number(e.target.value) })} />
          </label>
        </div>
      </details>
    </div>
  );
}
