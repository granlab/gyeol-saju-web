import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "결(結) — AI 명리 코치",
  description: "사주로 나의 패턴을 이해하고 선택을 돕는 설명 가능한 AI 명리 코치 (목업 프로토타입)",
  manifest: `${BASE}/manifest.webmanifest`,
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/icon.svg` },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf8f3",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-dvh">
        {/* 모바일 우선: max-w-md 중앙 정렬, 데스크톱에서는 폰 프레임처럼 보인다 */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper md:shadow-[0_0_0_1px_rgba(31,42,68,0.06),0_8px_30px_rgba(31,42,68,0.08)]">
          {children}
        </div>
      </body>
    </html>
  );
}
