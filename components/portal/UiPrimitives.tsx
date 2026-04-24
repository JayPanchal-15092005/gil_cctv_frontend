"use client";

import { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#1a2a3c]/90 shadow-[0_10px_30px_rgba(2,12,27,0.35)] ${className}`}>
      {children}
    </section>
  );
}

export function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | { label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700/80 bg-[#172537] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
      >
        {options.map((option) => {
          const normalized =
            typeof option === "string"
              ? { label: option, value: option }
              : option;

          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700/80 bg-[#172537] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
      />
    </label>
  );
}

export function StatusPill({ status }: { status: "online" | "offline" | "no-hit" }) {
  const styleMap = {
    online: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    offline: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    "no-hit": "bg-slate-500/20 text-slate-200 border-slate-400/30",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${styleMap[status]}`}>
      {status}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: "info" | "warning" | "critical" }) {
  const styleMap = {
    info: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
    warning: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    critical: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${styleMap[severity]}`}>
      {severity}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 text-sm sm:px-5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-slate-200 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-slate-300">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-slate-200 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
