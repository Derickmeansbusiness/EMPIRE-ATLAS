import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";

function cx(...parts: Array<string | false | null | undefined>): string { return parts.filter(Boolean).join(" "); }
export { cx };

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const buttonBase = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-gold text-ink hover:bg-gold-soft shadow-[0_10px_30px_-12px_rgba(193,155,99,0.6)]",
  secondary: "border border-platinum/25 text-ivory hover:border-gold/60 hover:text-gold",
  ghost: "text-platinum hover:text-gold hover:bg-white/5",
  danger: "border border-risk/50 text-risk hover:bg-risk/10",
};

export function Button({ variant = "primary", className, ...props }: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant }) {
  return <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function LinkButton({ variant = "primary", className, href, children, ...props }: ComponentPropsWithoutRef<typeof Link> & { variant?: ButtonVariant }) {
  return <Link href={href} className={cx(buttonBase, buttonVariants[variant], className)} {...props}>{children}</Link>;
}

export function Card({ className, children, light = false }: { className?: string; children: ReactNode; light?: boolean }) {
  return <section className={cx(light ? "card-light" : "card", "p-5 sm:p-6", className)}>{children}</section>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("eyebrow", className)}>{children}</p>;
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-platinum/80">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-mist">{hint}</p>}
    </div>
  );
}

const inputClass = "w-full rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2.5 text-sm text-ivory placeholder:text-slate-mist focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/60";
export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cx(inputClass, className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cx(inputClass, "min-h-32 leading-relaxed", className)} {...props} />;
}
export function Select({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return <select className={cx(inputClass, className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden="true" />;
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warning"; children: ReactNode }) {
  const tones = {
    info: "border-gold/40 bg-gold/10 text-ivory",
    success: "border-positive/50 bg-positive/10 text-ivory",
    error: "border-risk/50 bg-risk/10 text-ivory",
    warning: "border-gold/60 bg-gold/15 text-ivory",
  } as const;
  return <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-md border px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "gold" | "positive" | "risk" }) {
  const color = tone === "positive" ? "text-positive" : tone === "risk" ? "text-risk" : "text-ivory";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-mist">{label}</span>
      <span className={cx("font-serif text-2xl numeric leading-none", color)}>{value}</span>
      {sub && <span className="text-xs text-slate-mist">{sub}</span>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rise">
      <div className="max-w-3xl">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="editorial-h1 text-3xl sm:text-4xl lg:text-5xl text-ivory">{title}</h1>
        {description && <p className="mt-3 text-sm sm:text-base leading-relaxed text-platinum/80">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-platinum/20 px-6 py-10 text-center">
      <p className="font-serif text-lg text-ivory">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-mist">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
