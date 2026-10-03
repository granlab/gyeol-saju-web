"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChat, IconHeart, IconHome, IconMe, IconUser } from "./icons";
import { cx } from "./ui";

const TABS = [
  { href: "/today", label: "홈", Icon: IconHome },
  { href: "/me", label: "나의 결", Icon: IconMe },
  { href: "/ask", label: "AI 상담", Icon: IconChat },
  { href: "/match", label: "궁합", Icon: IconHeart, soon: true },
  { href: "/settings", label: "마이", Icon: IconUser },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md rounded-t-3xl border-t border-white bg-white/95 shadow-[0_-8px_28px_rgba(72,54,140,0.1)] backdrop-blur"
    >
      <ul className="grid h-[4.25rem] grid-cols-5">
        {TABS.map((t) => {
          const { href, label, Icon } = t;
          const soon = "soon" in t && t.soon;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold",
                  active ? "text-accent-deep" : "text-ink-mute hover:text-ink",
                )}
              >
                <span
                  className={cx(
                    "relative inline-flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-accent-soft",
                  )}
                >
                  <Icon size={24} strokeWidth={active ? 2.1 : 1.8} />
                  {soon && (
                    <span
                      aria-hidden="true"
                      className="absolute right-1.5 top-0.5 h-1.5 w-1.5 rounded-full bg-gold"
                    />
                  )}
                </span>
                <span>
                  {label}
                  {soon && <span className="sr-only"> (준비 중)</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
