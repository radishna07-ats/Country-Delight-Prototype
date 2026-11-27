import type { ReactNode } from "react";
import { I } from "./icons";
import { back } from "../backend/store";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Btn({ children, onClick, tone = "primary", size = "md", className, disabled, testId, ariaLabel, tier }: {
  children: ReactNode; onClick?: () => void; tone?: "primary" | "ghost" | "outline" | "danger" | "dark" | "vip"; size?: "sm" | "md" | "lg";
  className?: string; disabled?: boolean; testId?: string; ariaLabel?: string; tier?: "T1" | "T2" | "T3" | "T4";
}) {
  const tones = {
    primary: "bg-cd-green text-white hover:bg-[#186A2C] shadow-sm", dark: "bg-cd-deep text-white hover:bg-[#173d22]",
    ghost: "bg-transparent text-cd-green hover:bg-cd-mint", outline: "border border-cd-green text-cd-green bg-white hover:bg-cd-mint",
    danger: "border border-cd-danger text-cd-danger bg-white hover:bg-orange-50", vip: "bg-cd-vip text-cd-ink hover:bg-[#ecc94a]",
  };
  const sizes = { sm: "h-8 px-3 text-[12px] rounded-lg", md: "h-10 px-4 text-[13px] rounded-xl", lg: "h-12 px-5 text-[14px] rounded-xl" };
  return (
    <button type="button" data-testid={testId} aria-label={ariaLabel} disabled={disabled} onClick={onClick} data-agent-tier={tier}
      className={cx("inline-flex items-center justify-center gap-1.5 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cd-green", tones[tone], sizes[size], className)}>
      {children}
    </button>
  );
}

/** Full-width green CTA with price on the left, as observed in the app (CONFIRM SUBSCRIPTION). */
export function PriceCta({ price, strike, label, onClick, disabled, testId, tier }: { price: string; strike?: string; label: string; onClick: () => void; disabled?: boolean; testId?: string; tier?: "T1" | "T2" | "T3" | "T4" }) {
  return (
    <button type="button" data-testid={testId} onClick={onClick} disabled={disabled} data-agent-label={label} data-agent-tier={tier}
      className="w-full h-12 rounded-xl bg-cd-leaf text-white flex items-center justify-between px-4 font-bold text-[13px] tracking-wide disabled:opacity-40 hover:bg-cd-green transition-colors">
      <span>{price}{strike && <span className="ml-1.5 text-[11px] line-through opacity-70">{strike}</span>}</span>
      <span className="uppercase">{label}</span>
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max = 20, testId }: { value: number; onChange: (n: number) => void; min?: number; max?: number; testId?: string }) {
  return (
    <div className="inline-flex items-center h-9 rounded-lg border border-cd-leaf bg-white" data-testid={testId} data-agent-stepper data-agent-value={value}>
      <button type="button" aria-label="Decrease" className="w-9 h-full grid place-items-center text-cd-green disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)}><I.minus size={16} /></button>
      <span className="w-7 text-center font-bold text-[14px] tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase" className="w-9 h-full grid place-items-center text-cd-green disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}><I.plus size={16} /></button>
    </div>
  );
}

export function Toggle({ on, onChange, label, testId }: { on: boolean; onChange: (v: boolean) => void; label: string; testId?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} data-testid={testId} onClick={() => onChange(!on)}
      className={cx("w-10 h-6 rounded-full relative transition-colors", on ? "bg-cd-leaf" : "bg-gray-300")}>
      <span className={cx("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

export function Header({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-cd-line px-3 h-14 flex items-center gap-2">
      <button type="button" aria-label="Back" data-agent-action="back" onClick={onBack ?? back} className="w-9 h-9 grid place-items-center rounded-full hover:bg-cd-mint text-cd-ink"><I.back size={20} /></button>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-[16px] text-cd-ink truncate" data-agent-title>{title}</div>
        {subtitle && <div className="text-[11px] text-cd-muted truncate">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function Sheet({ open, onClose, children, title, testId }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; testId?: string }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" data-testid={testId}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-sheet animate-rise max-h-[88%] overflow-y-auto no-scrollbar">
        <div className="mx-auto mt-2 w-10 h-1.5 rounded-full bg-gray-200" />
        {title && <div className="px-5 pt-3 pb-1 text-center font-extrabold text-[16px] text-cd-ink">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Card({ children, className, testId, agent }: { children: ReactNode; className?: string; testId?: string; agent?: Record<string, string | number> }) {
  return <div data-testid={testId} {...agent} className={cx("bg-white rounded-2xl shadow-card border border-cd-line/60", className)}>{children}</div>;
}

export function Pill({ children, tone = "mint", className }: { children: ReactNode; tone?: "mint" | "vip" | "sky" | "gray" | "warn" | "graine"; className?: string }) {
  const t = { mint: "bg-cd-mint text-cd-green", vip: "bg-[#FFF5CC] text-cd-vipdeep", sky: "bg-cd-sky text-[#1B5E8C]", gray: "bg-gray-100 text-gray-600", warn: "bg-orange-50 text-cd-danger", graine: "bg-graine-100 text-graine-600" }[tone];
  return <span className={cx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold", t, className)}>{children}</span>;
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-12 gap-3">
      <div className="w-16 h-16 rounded-full bg-cd-mint grid place-items-center text-cd-green">{icon}</div>
      <div className="font-extrabold text-cd-ink">{title}</div>
      <div className="text-[12.5px] text-cd-muted">{body}</div>
      {action}
    </div>
  );
}
