import type { ReactNode } from "react";
import { cx } from "./ui";

/**
 * 짙은 남보라 밤하늘 헤더 — 초승달·별·구름·산등성이 일러스트(장식, aria-hidden).
 * children 은 일러스트 위에 올라간다. 내부 텍스트는 흰색 계열을 쓴다(.on-night 포커스 링 포함).
 * 별은 제목이 놓이는 왼쪽 위를 피해 배치한다. 좌표계는 390×240(위 기준 정렬, 아래쪽이 잘림).
 */
export function NightSky({
  children,
  className,
  variant = "hero",
}: {
  children?: ReactNode;
  className?: string;
  /** hero: 큰 달·산등성이(온보딩) / band: 낮은 띠, 작은 달(탭 헤더) */
  variant?: "hero" | "band";
}) {
  const hero = variant === "hero";
  return (
    <div className={cx("bg-night on-night relative overflow-hidden text-white", className)}>
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 390 240"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <radialGradient id="ns-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#f3e6c2" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f3e6c2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ns-horizon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4a4c4" stopOpacity="0" />
            <stop offset="1" stopColor="#f4a4c4" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="ns-ridge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6a5fb0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#4d4494" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* 별 */}
        <g fill="#ffffff">
          {hero ? (
            <>
              <circle cx="28" cy="34" r="1.6" opacity="0.9" />
              <circle cx="76" cy="20" r="1.1" opacity="0.6" />
              <circle cx="112" cy="58" r="1.4" opacity="0.75" />
              <circle cx="262" cy="16" r="1.1" opacity="0.6" />
              <circle cx="306" cy="52" r="1.3" opacity="0.7" />
              <circle cx="352" cy="28" r="1.6" opacity="0.85" />
              <circle cx="370" cy="92" r="1" opacity="0.5" />
              <circle cx="40" cy="110" r="1.2" opacity="0.6" />
              <circle cx="330" cy="128" r="1.2" opacity="0.55" />
              <circle cx="22" cy="166" r="1" opacity="0.4" />
              <circle cx="364" cy="166" r="1.1" opacity="0.5" />
              <path d="M58 70l1.6 4.4 4.4 1.6-4.4 1.6L58 82l-1.6-4.4L52 76l4.4-1.6Z" opacity="0.9" />
              <path d="M338 64l1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2Z" opacity="0.75" />
              <path d="M350 146l1.4 3.8 3.8 1.4-3.8 1.4-1.4 3.8-1.4-3.8-3.8-1.4 3.8-1.4Z" opacity="0.7" />
            </>
          ) : (
            <>
              <circle cx="236" cy="20" r="1.1" opacity="0.6" />
              <circle cx="268" cy="50" r="1.4" opacity="0.7" />
              <circle cx="300" cy="16" r="1" opacity="0.5" />
              <circle cx="372" cy="104" r="1.1" opacity="0.5" />
              <circle cx="246" cy="92" r="1.2" opacity="0.5" />
              <circle cx="212" cy="60" r="1" opacity="0.45" />
              <circle cx="20" cy="140" r="1" opacity="0.35" />
              <path d="M284 78l1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2Z" opacity="0.8" />
            </>
          )}
        </g>

        {/* 초승달 + 글로우 */}
        {hero ? (
          <g>
            <circle cx="178" cy="72" r="82" fill="url(#ns-glow)" />
            <path d="M152 26a50 50 0 1 0 46 84 40 40 0 1 1-46-84Z" fill="#f3e6c2" opacity="0.95" />
          </g>
        ) : (
          <g opacity="0.55">
            <circle cx="352" cy="52" r="40" fill="url(#ns-glow)" />
            <path d="M342 30a24 24 0 1 0 22 40 19 19 0 1 1-22-40Z" fill="#f3e6c2" opacity="0.95" />
          </g>
        )}

        {/* 구름 */}
        <g fill="#ffffff">
          <ellipse cx="60" cy={hero ? 168 : 104} rx="70" ry="16" opacity="0.08" />
          <ellipse cx="120" cy={hero ? 182 : 118} rx="90" ry="18" opacity="0.07" />
          <ellipse cx="320" cy={hero ? 160 : 98} rx="80" ry="16" opacity="0.08" />
          <ellipse cx="260" cy={hero ? 190 : 126} rx="100" ry="20" opacity="0.06" />
        </g>

        {/* 산등성이 + 분홍 지평선 */}
        {hero && (
          <path d="M0 200c40-26 80-40 120-30s70 36 110 30 70-36 110-40 40 6 50 10v70H0Z" fill="url(#ns-ridge)" />
        )}
        <rect x="0" y={hero ? 130 : 70} width="390" height={hero ? 110 : 170} fill="url(#ns-horizon)" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}

/** 로고 워드마크: 결 + GYEOL */
export function Wordmark({ size = "lg", className }: { size?: "sm" | "lg"; className?: string }) {
  const big = size === "lg";
  return (
    <div className={cx("flex flex-col items-center leading-none", className)}>
      <span className={cx("font-display font-bold text-white", big ? "text-[3.4rem]" : "text-2xl")} lang="ko">
        결
      </span>
      <span
        className={cx(
          "mt-1 font-semibold uppercase text-night-text",
          big ? "text-xs tracking-[0.42em]" : "text-[0.6rem] tracking-[0.36em]",
        )}
        aria-hidden="true"
      >
        GYEOL
      </span>
    </div>
  );
}
