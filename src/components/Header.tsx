import { useRef } from "react";
import { useScrollProgress } from "../lib/motion";
import { container } from "./ui";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`grid grid-cols-3 gap-[2px] rounded-lg bg-ink p-[7px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
        <i key={cell} className={`rounded-[1.5px] ${[0, 1, 3, 4, 7].includes(cell) ? "bg-mint" : cell === 8 ? "bg-white/70" : "bg-white/10"}`} />
      ))}
    </span>
  );
}

const navLink = "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink sm:px-3.5 sm:text-[15px]";

export function Header() {
  const barRef = useRef<HTMLDivElement>(null);
  useScrollProgress(barRef);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className={`${container} flex h-16 items-center justify-between`}>
        <a href="#top" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-ink">
          <BrandMark className="h-8 w-8" />
          LinkGlyph
        </a>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary navigation">
          <a href="#studio" className={navLink}>
            Studio
          </a>
          <a href="#features" className={`${navLink} hidden sm:inline-flex`}>
            Why LinkGlyph
          </a>
        </nav>
      </div>
      <div ref={barRef} aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[2px] origin-left scale-x-0 bg-mint" />
    </header>
  );
}
