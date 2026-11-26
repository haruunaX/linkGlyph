import { Check, Info } from "lucide-react";

export interface ToastMessage {
  id: number;
  text: string;
  tone?: "success" | "info";
  action?: { label: string; run: () => void };
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-ink py-2.5 pl-3.5 pr-2.5 text-sm font-medium text-white shadow-[0_16px_40px_-12px_rgba(11,18,32,.5)] transition duration-300 ${
        toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      {toast?.tone === "info" ? <Info className="h-4 w-4 text-slate-300" /> : <Check className="h-4 w-4 text-mint" />}
      <span className="pr-1">{toast?.text}</span>
      {toast?.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.run();
            onDismiss();
          }}
          className="rounded-md px-2 py-1 text-mint transition hover:bg-white/10"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
