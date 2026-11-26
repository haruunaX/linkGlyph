import { useMemo, useState } from "react";
import { Copy, Pencil, QrCode, Search, Trash2 } from "lucide-react";
import { LIBRARY_LIMIT } from "../lib/storage";
import type { SavedProject } from "../types";
import { QrThumb } from "./QrThumb";
import { card, iconButton, input } from "./ui";

interface Props {
  items: SavedProject[];
  activeId: string | null;
  onLoad: (project: SavedProject) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

function timeAgo(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  if (!Number.isFinite(seconds)) return "";
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

const typeLabel: Record<SavedProject["type"], string> = { url: "Link", text: "Text", email: "Email", phone: "Phone", wifi: "Wi-Fi" };

export function Library({ items, activeId, onLoad, onRename, onDuplicate, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.name} ${item.content}`.toLowerCase().includes(q));
  }, [items, query]);

  const commitRename = (id: string) => {
    onRename(id, draftName);
    setEditingId(null);
  };

  return (
    <section id="library" className="scroll-mt-24" aria-labelledby="library-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="library-title" className="text-lg font-semibold tracking-tight text-ink">
            My codes
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {items.length} of {LIBRARY_LIMIT} · saved in this browser
          </p>
        </div>
        {items.length > 6 && (
          <label className="relative w-full sm:w-64">
            <span className="sr-only">Search saved codes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${input} py-2 pl-9 text-sm`} type="search" placeholder="Search codes" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        )}
      </div>

      {items.length === 0 ? (
        <div className={`${card} mt-4 flex flex-col items-center px-6 py-12 text-center`}>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-400">
            <QrCode className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">No saved codes yet</p>
          <p className="mt-1 text-[13px] text-slate-500">Codes you save appear here, ready to reuse.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">No codes match "{query}".</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const active = item.id === activeId;
            const editing = item.id === editingId;
            return (
              <li
                key={item.id}
                className={`group relative flex items-center gap-3 rounded-xl border bg-white p-2.5 pr-2 transition hover:border-slate-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,.18)] ${
                  active ? "border-ink/70 ring-2 ring-mint/40" : "border-slate-200/80"
                }`}
              >
                <QrThumb project={item} />
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <input
                      autoFocus
                      aria-label="New name"
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-mint/40"
                      value={draftName}
                      maxLength={40}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={() => commitRename(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(item.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                  ) : (
                    <button type="button" onClick={() => onLoad(item)} className="block w-full text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-mint">
                      <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{item.content}</span>
                    </button>
                  )}
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {typeLabel[item.type]} · {timeAgo(item.savedAt)}
                  </span>
                </div>
                <div className="relative z-10 flex flex-col opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    className={iconButton}
                    aria-label={`Rename ${item.name}`}
                    title="Rename"
                    onClick={() => {
                      setDraftName(item.name);
                      setEditingId(item.id);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className={iconButton} aria-label={`Duplicate ${item.name}`} title="Duplicate" onClick={() => onDuplicate(item.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className={`${iconButton} hover:bg-rose-50 hover:text-rose-600`} aria-label={`Delete ${item.name}`} title="Delete" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
