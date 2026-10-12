import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "secondary",
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-indigo-700 text-white border-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 disabled:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400 disabled:shadow-none shadow-sm",
    secondary:
      "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 disabled:bg-neutral-50 disabled:border-neutral-200 disabled:text-neutral-400 disabled:shadow-none shadow-sm",
    ghost:
      "bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 disabled:text-neutral-300 disabled:hover:bg-transparent",
    danger:
      "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-100 disabled:border-rose-200 disabled:text-rose-300 disabled:shadow-none shadow-sm"
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-2.5 text-xs rounded-md",
    md: "h-9 px-3.5 text-xs font-semibold rounded-lg",
    lg: "h-10 px-4 text-sm font-semibold rounded-lg"
  };

  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 border font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  label,
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-7 w-7 text-xs rounded-md",
    md: "h-8 w-8 text-xs rounded-lg",
    lg: "h-9 w-9 text-sm rounded-lg"
  };

  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex select-none items-center justify-center border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 active:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none",
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white shadow-sm transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "blue" | "red" | "violet";
  className?: string;
}) {
  const tones = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "violet"
}: {
  value: number;
  tone?: "violet" | "green" | "amber" | "blue" | "red";
}) {
  const tones = {
    violet: "bg-violet-600",
    green: "bg-emerald-600",
    amber: "bg-amber-500",
    blue: "bg-sky-600",
    red: "bg-rose-600"
  };

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className={cn("h-full rounded-full transition-all duration-300", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold tracking-wider uppercase text-indigo-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-bold text-neutral-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}
