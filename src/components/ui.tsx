"use client";

import Link from "next/link";
import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { IconChevron, IconInfo } from "./icons";

export function cx(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  as: As = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={cx(
        "rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_2px_rgba(31,42,68,0.04)]",
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

const BTN: Record<BtnVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-deep disabled:bg-ink-mute/40",
  secondary: "border border-line bg-white text-ink hover:bg-paper-deep disabled:text-ink-mute",
  ghost: "text-accent-deep hover:bg-accent-soft disabled:text-ink-mute",
  danger: "bg-safety text-white hover:brightness-110 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  block,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; block?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed",
        BTN[variant],
        block && "w-full",
        className,
      )}
      {...rest}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  block,
}: {
  href: string;
  variant?: BtnVariant;
  className?: string;
  children: ReactNode;
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-base font-semibold transition-colors",
        BTN[variant],
        block && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Chip({
  children,
  onClick,
  title,
  active,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  ariaLabel?: string;
}) {
  const cls = cx(
    "inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-sm",
    active ? "border-accent bg-accent-soft text-accent-deep" : "border-line bg-paper text-ink-soft",
    onClick && "hover:border-accent hover:text-accent-deep",
  );
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button type="button" className={cx(cls, "min-h-11")} onClick={onClick} title={title} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "caution" | "safety" }) {
  const t = {
    neutral: "bg-paper-deep text-ink-soft",
    accent: "bg-accent-soft text-accent-deep",
    caution: "bg-caution-soft text-caution",
    safety: "bg-safety-soft text-safety",
  }[tone];
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold text-ink">{children}</h2>
      {sub && <p className="mt-0.5 text-sm text-ink-mute">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="pt-safe">
      <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {sub && <p className="mt-1 text-base text-ink-soft">{sub}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

/** 접근성 있는 접이식 영역 */
export function Collapsible({
  label,
  children,
  defaultOpen = false,
  className,
  buttonClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl text-left text-base font-semibold text-accent-deep",
          buttonClassName,
        )}
      >
        <span>{label}</span>
        <IconChevron open={open} size={20} />
      </button>
      {open && (
        <div id={id} className="pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

/** 토글 스위치 (role=switch) */
export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <label htmlFor={id} className="text-base font-semibold text-ink">
          {label}
        </label>
        {description && <p className="text-sm text-ink-mute">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-accent" : "bg-ink-mute/40",
        )}
      >
        <span className="sr-only">{checked ? "켜짐" : "꺼짐"}</span>
        <span
          aria-hidden="true"
          className={cx(
            "inline-block h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-7" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "caution" }) {
  return (
    <p
      className={cx(
        "flex items-start gap-2 rounded-2xl px-4 py-3 text-sm leading-relaxed",
        tone === "caution" ? "bg-caution-soft text-caution" : "bg-paper-deep text-ink-soft",
      )}
    >
      <IconInfo size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** 0~100 가로 바 */
export function Bar({ value, colorClass, label }: { value: number; colorClass: string; label: string }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-paper-deep"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
    >
      <div className={cx("h-full rounded-full", colorClass)} style={{ width: `${v}%` }} />
    </div>
  );
}
