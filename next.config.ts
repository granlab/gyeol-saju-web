import type { NextConfig } from "next";

const basePath = "/gyeol-saju-web";

const nextConfig: NextConfig = {
  // Next 16 이 dev 시 AGENTS.md/CLAUDE.md 를 자동 생성하는 기능 비활성화 (저장소에 불필요)
  agentRules: false,
  // GitHub Pages 정적 배포: https://granlab.github.io/gyeol-saju-web/
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
