"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconAsk, IconMe, IconSettings, IconToday } from "./icons";
import { cx } from "./ui";

const TABS = [
  { href: "/today", label: "오늘", Icon: IconToday },
  { href: "/me", label: "나의 결", Icon: IconMe },
  { href: "/ask", label: "묻기", Icon: IconAsk },
  { href: "/settings", label: "설정", Icon: IconSettings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-line bg-paper/95 backdrop-blur"
    >
      <ul className="grid h-16 grid-cols-4">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                  active ? "text-accent-deep" : "text-ink-mute hover:text-ink",
                )}
              >
                <Icon size={24} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
