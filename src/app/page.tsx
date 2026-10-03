"use client";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

/** `/` 온보딩. 프로필이 이미 있으면 /today 로 replace. */
export default function Home() {
  return <OnboardingFlow />;
}
