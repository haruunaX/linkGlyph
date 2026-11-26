import { Plus } from "lucide-react";
import { buttonSecondary } from "./ui";

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`grid grid-cols-3 gap-[2px] rounded-lg bg-ink p-[7px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
        <i key={cell} className={`rounded-[1.5px] ${[0, 1, 3, 4, 7].includes(cell) ? "bg-mint" : cell === 8 ? "bg-white/70" : "bg-white/10"}`} />
      ))}
    </span>
  );
}

export function Header({ onNew }: { onNew: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-ink">
          <BrandMark />
          LinkGlyph
        </a>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary navigation">
          <a href="#studio" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink md:inline-flex">
            Studio
          </a>
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink md:inline-flex">
            Why LinkGlyph
          </a>
          <button type="button" onClick={onNew} className={`${buttonSecondary} px-3 py-2`}>
            <Plus className="h-4 w-4" />
            New code
          </button>
        </nav>
      </div>
    </header>
  );
}
