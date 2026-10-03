import Link from "next/link";
import type { ReactNode } from "react";
import { NightSky } from "./NightSky";
import { cx } from "./ui";

/**
 * 탭 화면 공용 헤더 — 밤하늘 띠 위에 제목·부제. 아래 콘텐츠가 헤더 위로 살짝 겹쳐 올라오도록
 * 호출하는 쪽에서 `-mt-6` 등을 쓴다(overlap 유틸 참고).
 */
export function AppHeader({
  title,
  sub,
  right,
  children,
  className,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  /** 제목 아래 추가 영역(세그먼트 탭 등) */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <NightSky variant="band" className={cx("pt-safe", className)}>
      <header className="px-5 pb-9 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            {sub && <p className="mt-1 text-base text-night-text">{sub}</p>}
          </div>
          {right}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </header>
    </NightSky>
  );
}

/** 헤더와 겹치는 콘텐츠 컨테이너 */
export function Overlap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("relative -mt-6 space-y-5 px-5", className)}>{children}</div>;
}

/**
 * 밤하늘 위 세그먼트 탭(알약). 링크·버튼 혼합 가능.
 * items[].href 가 있으면 링크, onSelect 가 있으면 버튼. disabled 면 '준비 중'.
 */
export function SegmentedTabs({
  items,
  value,
  onSelect,
  ariaLabel,
}: {
  items: Array<{ key: string; label: string; href?: string; disabled?: boolean }>;
  value: string;
  onSelect?: (key: string) => void;
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="rounded-full bg-white/15 p-1 backdrop-blur-sm">
      <ul className="grid grid-cols-3 gap-1">
        {items.map((it) => {
          const active = it.key === value;
          const cls = cx(
            "flex min-h-10 w-full items-center justify-center gap-1 rounded-full px-2 text-sm font-semibold transition-colors",
            active ? "bg-white text-ink shadow-sm" : "text-white/90 hover:bg-white/10",
            it.disabled && "text-white/60",
          );
          return (
            <li key={it.key}>
              {it.href ? (
                <Link href={it.href} className={cls}>
                  {it.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className={cls}
                  aria-current={active ? "true" : undefined}
                  aria-disabled={it.disabled || undefined}
                  onClick={() => onSelect?.(it.key)}
                >
                  {it.label}
                  {it.disabled && (
                    <span className="rounded-full bg-white/20 px-1.5 text-[0.6rem] font-semibold">준비 중</span>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
