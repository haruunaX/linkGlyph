import { Check, Info } from "lucide-react";

export interface ToastMessage {
  id: number;
  text: string;
  tone?: "success" | "info";
}

export function Toast({ toast }: { toast: ToastMessage | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl bg-ink py-3 pl-4 pr-4 text-[15px] font-medium text-white shadow-[0_16px_40px_-12px_rgba(11,18,32,.5)] transition duration-300 ${
        toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      {toast?.tone === "info" ? <Info className="h-4 w-4 text-slate-300" /> : <Check className="h-4 w-4 text-mint" />}
      <span className="pr-1">{toast?.text}</span>
    </div>
  );
}
