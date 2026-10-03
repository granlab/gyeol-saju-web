import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "결 GYEOL — AI 명리 코치",
  description: "사주로 나의 패턴을 이해하고 선택을 돕는 설명 가능한 AI 명리 코치 (목업 프로토타입)",
  manifest: `${BASE}/manifest.webmanifest`,
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/icon.svg` },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e1b45",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-dvh">
        {/* 모바일 우선: max-w-md 중앙 정렬, 데스크톱에서는 폰 프레임처럼 보인다 */}
        <div className="bg-app relative mx-auto flex min-h-dvh w-full max-w-md flex-col md:shadow-[0_0_0_1px_rgba(72,54,140,0.08),0_12px_40px_rgba(72,54,140,0.12)]">
          {children}
        </div>
      </body>
    </html>
  );
}
