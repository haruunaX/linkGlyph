import { ChevronDown, Globe2, Mail, Phone, Type, Wifi } from "lucide-react";
import type { ProjectState, QrFields, QrType } from "../types";
import { input, label } from "./ui";

const typeOptions: Array<{ id: QrType; label: string; icon: typeof Globe2 }> = [
  { id: "url", label: "Link", icon: Globe2 },
  { id: "text", label: "Text", icon: Type },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
];

interface Props {
  state: ProjectState;
  onChange: (next: ProjectState) => void;
}

function Field({ title, hint, className = "", children }: { title: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`${label} ${className}`}>
      {title}
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-2 block text-sm font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

export function ContentForm({ state, onChange }: Props) {
  const f = state.fields;
  const set = <K extends keyof QrFields>(key: K, value: QrFields[K]) => onChange({ ...state, fields: { ...f, [key]: value } });

  return (
    <div>
      <div role="tablist" aria-label="QR content type" className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1">
        {typeOptions.map(({ id, label: text, icon: Icon }) => {
          const active = state.type === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange({ ...state, type: id })}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-1 py-2.5 text-sm font-medium sm:px-2 sm:text-[15px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint ${
                active ? "bg-white text-ink ring-1 ring-slate-200" : "text-slate-500 hover:text-ink"
              }`}
            >
              <Icon className="hidden h-[18px] w-[18px] shrink-0 sm:block" />
              <span className="truncate">{text}</span>
            </button>
          );
        })}
      </div>

      <div key={state.type} className="mt-4 animate-[fade-in_.2s_ease-out]">
        {state.type === "url" && (
          <Field title="Website or link" hint="https:// is added automatically if you leave it out.">
            <input className={input} type="url" inputMode="url" value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com" />
          </Field>
        )}
        {state.type === "text" && (
          <Field title="Text" hint={`${f.text.length} / 1200 characters`}>
            <textarea className={`${input} min-h-28 resize-y lg:min-h-0`} rows={2} maxLength={1200} value={f.text} onChange={(e) => set("text", e.target.value)} />
          </Field>
        )}
        {state.type === "email" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field title="Email address">
              <input className={input} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@example.com" />
            </Field>
            <Field title="Subject">
              <input className={input} value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Optional" />
            </Field>
            <Field title="Message" className="sm:col-span-2 lg:col-span-1">
              <textarea className={`${input} min-h-24 resize-y lg:min-h-0`} rows={1} value={f.body} onChange={(e) => set("body", e.target.value)} placeholder="Optional" />
            </Field>
          </div>
        )}
        {state.type === "phone" && (
          <Field title="Phone number" hint="Include the country code for international callers.">
            <input className={input} type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+63 912 345 6789" />
          </Field>
        )}
        {state.type === "wifi" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field title="Network name">
              <input className={input} value={f.ssid} onChange={(e) => set("ssid", e.target.value)} placeholder="My Wi-Fi" />
            </Field>
            <Field title="Security">
              <div className="relative">
                <select className={`${input} appearance-none pr-10`} value={f.encryption} onChange={(e) => set("encryption", e.target.value as QrFields["encryption"])}>
                  <option value="WPA">WPA / WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No password</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </Field>
            <Field title="Password" className="sm:col-span-2 lg:col-span-1">
              <input className={input} disabled={f.encryption === "nopass"} value={f.password} onChange={(e) => set("password", e.target.value)} placeholder={f.encryption === "nopass" ? "Not needed" : "Network password"} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
