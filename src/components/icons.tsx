/**
 * 인라인 SVG 아이콘 세트 (의존성 없음, 24px 그리드, 1.8 stroke, 둥근 끝).
 * 장식용은 aria-hidden. 이모지 대신 이 세트만 쓴다.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ───────── 네비게이션 ───────── */

export function IconHome(p: P) {
  return (
    <Svg {...p}>
      <path d="M3.5 10.5 12 3.8l8.5 6.7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.5Z" />
    </Svg>
  );
}

/** 해 — 오늘 */
export function IconToday(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </Svg>
  );
}

/** '결' — 물결 두 줄 */
export function IconMe(p: P) {
  return (
    <Svg {...p}>
      <path d="M3 9c3-2.5 6-2.5 9 0s6 2.5 9 0" />
      <path d="M3 15c3-2.5 6-2.5 9 0s6 2.5 9 0" />
    </Svg>
  );
}

/** 말풍선 + 반짝 — AI 상담 */
export function IconChat(p: P) {
  return (
    <Svg {...p}>
      <path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4.5 19.5l1.2-3.9A7.5 7.5 0 1 1 20 11.5Z" />
      <path d="M12 8.2v1.2M12 13.6v1.2M9.3 11.5h1.2M13.5 11.5h1.2" />
    </Svg>
  );
}

/** 물음표 말풍선 — 묻기(구버전 호환) */
export function IconAsk(p: P) {
  return (
    <Svg {...p}>
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12Z" />
      <path d="M9.8 9.7a2.3 2.3 0 0 1 4.4.8c0 1.5-2.2 1.9-2.2 3.1" />
      <path d="M12 16.4h.01" />
    </Svg>
  );
}

export function IconHeart(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z" />
    </Svg>
  );
}

export function IconUser(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.2c.9-3.6 3.8-5.6 7.5-5.6s6.6 2 7.5 5.6" />
    </Svg>
  );
}

export function IconSettings(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Svg>
  );
}

/* ───────── 영역·주제 ───────── */

export function IconBriefcase(p: P) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </Svg>
  );
}

export function IconLeaf(p: P) {
  return (
    <Svg {...p}>
      <path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-14 14Z" />
      <path d="M5 19c3-4 6-7 10-10" />
    </Svg>
  );
}

export function IconMoon(p: P) {
  return (
    <Svg {...p}>
      <path d="M19.5 14.3A7.5 7.5 0 0 1 9.7 4.5a7.5 7.5 0 1 0 9.8 9.8Z" />
    </Svg>
  );
}

export function IconSparkle(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 3.5c.6 4 2.5 5.9 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.6 5.9-2.5 6.5-6.5Z" />
      <path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z" />
    </Svg>
  );
}

export function IconCalendar(p: P) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </Svg>
  );
}

export function IconClock(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconMapPin(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </Svg>
  );
}

export function IconUsers(p: P) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M2.8 19.5c.7-3 3.1-4.8 6.2-4.8s5.5 1.8 6.2 4.8" />
      <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.6 14.9c2 .5 3.2 1.9 3.6 4.1" />
    </Svg>
  );
}

export function IconLock(p: P) {
  return (
    <Svg {...p}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Svg>
  );
}

/* ───────── 동작·상태 ───────── */

export function IconArrowRight(p: P) {
  return (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconChevron({ open, ...p }: P & { open?: boolean }) {
  return (
    <Svg {...p} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .15s" }}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconChevronLeft(p: P) {
  return (
    <Svg {...p}>
      <path d="m15 5-7 7 7 7" />
    </Svg>
  );
}

export function IconCheck(p: P) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </Svg>
  );
}

export function IconInfo(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  );
}

export function IconPhone(p: P) {
  return (
    <Svg {...p}>
      <path d="M21 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 4.2 2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </Svg>
  );
}

export function IconSend(p: P) {
  return (
    <Svg {...p}>
      <path d="M4 12 20 4l-6 16-3-7-7-1Z" />
    </Svg>
  );
}

export function IconTrash(p: P) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </Svg>
  );
}

export function IconRefresh(p: P) {
  return (
    <Svg {...p}>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
    </Svg>
  );
}

export function IconShield(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 3 4.5 6v6c0 4.4 3.2 7.9 7.5 9 4.3-1.1 7.5-4.6 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}
