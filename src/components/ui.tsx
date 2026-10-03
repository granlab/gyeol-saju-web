"use client";

import Link from "next/link";
import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { IconChevron, IconInfo } from "./icons";

export function cx(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

/** 둥근 흰 카드 + 부드러운 보라 그림자 */
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
    <As className={cx("rounded-3xl border border-white bg-white p-5 shadow-card", className)} {...rest}>
      {children}
    </As>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "night";

const BTN: Record<BtnVariant, string> = {
  primary: "bg-cta text-white shadow-[0_8px_20px_rgba(109,92,224,0.28)] disabled:shadow-none",
  secondary: "border border-line bg-white text-ink hover:bg-paper-deep disabled:text-ink-mute",
  ghost: "text-accent-deep hover:bg-accent-soft disabled:text-ink-mute",
  danger: "bg-safety text-white hover:brightness-110 disabled:opacity-50",
  night: "bg-night text-white hover:bg-night-soft disabled:opacity-50",
};

const BTN_BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  block,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; block?: boolean }) {
  return <button type="button" className={cx(BTN_BASE, BTN[variant], block && "w-full", className)} {...rest} />;
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
    <Link href={href} className={cx(BTN_BASE, BTN[variant], block && "w-full", className)}>
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
    active ? "border-accent/50 bg-accent-soft font-semibold text-accent-deep" : "border-line bg-paper text-ink-soft",
    onClick && "hover:border-accent/50 hover:bg-accent-soft hover:text-accent-deep",
  );
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button type="button" className={cx(cls, "min-h-11")} onClick={onClick} title={title} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "caution" | "safety" | "gold";
}) {
  const t = {
    neutral: "bg-paper-deep text-ink-soft",
    accent: "bg-accent-soft text-accent-deep",
    caution: "bg-caution-soft text-caution",
    safety: "bg-safety-soft text-safety",
    gold: "bg-gold-soft text-caution",
  }[tone];
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function SectionTitle({ children, sub, icon }: { children: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        {icon && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
            {icon}
          </span>
        )}
        {children}
      </h2>
      {sub && <p className="mt-0.5 text-sm text-ink-mute">{sub}</p>}
    </div>
  );
}

/** 작은 아이콘 라벨 (카드 제목 왼쪽 등) */
export function IconBubble({
  children,
  tone = "accent",
  className,
}: {
  children: ReactNode;
  tone?: "accent" | "gold" | "love" | "work" | "mind" | "night";
  className?: string;
}) {
  const t = {
    accent: "bg-accent-soft text-accent-deep",
    gold: "bg-gold-soft text-caution",
    love: "bg-white/70 text-love",
    work: "bg-white/70 text-work",
    mind: "bg-white/70 text-mind",
    night: "bg-white/15 text-white",
  }[tone];
  return (
    <span className={cx("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl", t, className)}>
      {children}
    </span>
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

/** 별칭 첫 글자 아바타 */
export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const ch = name.trim().slice(0, 1) || "결";
  return (
    <span
      aria-hidden="true"
      className={cx(
        "bg-cta inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-[0_6px_16px_rgba(109,92,224,0.3)]",
        size === "lg" ? "h-16 w-16 text-2xl" : "h-11 w-11 text-lg",
      )}
    >
      {ch}
    </span>
  );
}

/** 예정 기능 표시 — 구현 범위 밖 기능은 이 라벨만 붙인다 */
export function SoonBadge() {
  return <Badge tone="neutral">준비 중</Badge>;
}
