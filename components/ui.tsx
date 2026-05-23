import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "secondary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-ink text-white border-ink hover:bg-neutral-800 disabled:bg-neutral-400",
    secondary:
      "bg-white text-neutral-900 border-line hover:border-neutral-300 hover:bg-neutral-50",
    ghost:
      "bg-transparent text-neutral-700 border-transparent hover:bg-neutral-100",
    danger:
      "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed",
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
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-300",
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
        "rounded-xl border border-neutral-100 bg-white shadow-sm hover:shadow-md hover:border-neutral-200/60 transition-all duration-300",
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
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
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
    violet: "bg-violet-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-sky-500",
    red: "bg-rose-500"
  };

  return (
    <div className="h-2 w-full overflow-hidden rounded-md bg-neutral-100">
      <div
        className={cn("h-full rounded-md", tones[tone])}
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
          <p className="mb-1 text-xs font-semibold uppercase text-violet-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold text-neutral-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}
