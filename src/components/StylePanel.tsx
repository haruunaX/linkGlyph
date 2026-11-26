import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { ErrorLevel, ProjectState } from "../types";
import { label } from "./ui";

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
      <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-1.5 pr-3 transition focus-within:border-ink focus-within:bg-white focus-within:ring-4 focus-within:ring-mint/30 hover:border-slate-300">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-black/10" style={{ background: value }}>
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

function Segmented<T extends string | number>({
  title,
  caption,
  value,
  options,
  onValue,
}: {
  title: string;
  caption?: string;
  value: T;
  options: Array<[T, string, string?]>;
  onValue: (v: T) => void;
}) {
  return (
    <div>
      <span className={`${label} flex justify-between gap-2`}>
        {title}
        {caption && <span className="truncate font-normal text-slate-400">{caption}</span>}
      </span>
      <div role="radiogroup" aria-label={title} className="mt-1.5 grid gap-1 rounded-xl bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(([v, text, hint]) => {
          const active = v === value;
          return (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={hint ?? text}
              title={hint}
              onClick={() => onValue(v)}
              className={`whitespace-nowrap rounded-lg px-1 py-2 text-[13px] font-medium tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint sm:text-sm ${
                active ? "bg-white text-ink ring-1 ring-slate-200" : "text-slate-500 hover:text-ink"
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StylePanel({ state, onChange }: Props) {
  const setColor = (key: "dark" | "light", value: string) => onChange({ ...state, [key]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Color presets">
        {presets.map((preset) => {
          const active = state.dark === preset.dark && state.light === preset.light;
          return (
            <button
              key={preset.name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ ...state, dark: preset.dark, light: preset.light })}
              className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-2 text-left text-[13px] font-medium transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
                active ? "border-ink text-ink ring-1 ring-ink" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-ink"
              }`}
            >
              <span className="flex h-7 w-full overflow-hidden rounded-md border border-black/5">
                <i className="w-1/2" style={{ background: preset.dark }} />
                <i className="w-1/2" style={{ background: preset.light }} />
              </span>
              <span className="truncate">{preset.name}</span>
              {active && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-mint text-ink">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ColorInput title="Code color" value={state.dark} onValue={(v) => setColor("dark", v)} />
        <ColorInput title="Background" value={state.light} onValue={(v) => setColor("light", v)} />
      </div>
    </div>
  );
}

const levelInfo: Record<ErrorLevel, string> = { L: "Low · 7%", M: "Medium · 15%", Q: "Quartile · 25%", H: "High · 30%" };

export function OutputPanel({ state, onChange }: Props) {
  return (
    <div className="space-y-3.5">
      <Segmented<number>
        title="Export size"
        caption="pixels"
        value={state.size}
        onValue={(size) => onChange({ ...state, size })}
        options={[
          [512, "512", "512 pixels"],
          [1024, "1024", "1024 pixels"],
          [2048, "2048", "2048 pixels"],
        ]}
      />
      <Segmented<ErrorLevel>
        title="Error correction"
        caption={levelInfo[state.level]}
        value={state.level}
        onValue={(level) => onChange({ ...state, level })}
        options={(["L", "M", "Q", "H"] as ErrorLevel[]).map((l) => [l, l, levelInfo[l]])}
      />
      <label className={label}>
        <span className="flex justify-between">
          Quiet zone<span className="font-normal tabular-nums text-slate-400">{state.margin} modules</span>
        </span>
        <input className="range mt-2.5 w-full" type="range" min={2} max={10} value={state.margin} onChange={(e) => onChange({ ...state, margin: Number(e.target.value) })} />
      </label>
    </div>
  );
}
