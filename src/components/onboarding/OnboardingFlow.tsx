"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { computeChart } from "@/lib/saju";
import { CITIES, type BirthInput } from "@/lib/saju/types";
import { CONSENT_VERSION, toEngineInput, type StoredProfile } from "@/lib/storage";
import { useProfile } from "@/lib/hooks/useProfile";
import { useTodayKey } from "@/lib/hooks/useStore";
import { errorMessage, kstDateKey } from "@/lib/format";
import { LoadingView } from "../ChartGate";
import { Button, Card, Notice, Switch, cx } from "../ui";
import { IconShield } from "../icons";

const ABROAD = "abroad";
const SEOUL = CITIES[0];
const MIN_YEAR = 1900;

type GenderChoice = "female" | "male" | "none";

const pad = (n: number) => String(n).padStart(2, "0");

/** 년/월/일 문자열 검증 → { iso } 또는 { error } */
export function validateBirthDate(y: string, m: string, d: string, todayKey: string): { iso?: string; error?: string } {
  if (!y || !m || !d) return { error: "생년월일을 모두 입력해 주세요." };
  const yy = Number(y);
  const mm = Number(m);
  const dd = Number(d);
  if (![yy, mm, dd].every(Number.isInteger)) return { error: "숫자로 입력해 주세요." };
  const maxYear = Number((todayKey || kstDateKey(Date.now())).slice(0, 4));
  if (yy < MIN_YEAR || yy > maxYear) return { error: `태어난 해는 ${MIN_YEAR}년부터 ${maxYear}년 사이로 입력해 주세요.` };
  if (mm < 1 || mm > 12) return { error: "월은 1부터 12 사이로 입력해 주세요." };
  const dim = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  if (dd < 1 || dd > dim) return { error: `${mm}월은 ${dim}일까지 있어요.` };
  const iso = `${yy}-${pad(mm)}-${pad(dd)}`;
  const today = todayKey || kstDateKey(Date.now());
  if (iso > today) return { error: "오늘 이후 날짜는 입력할 수 없어요." };
  return { iso };
}

function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-base font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-ink-mute">{hint}</p>}
      {error && (
        <p className="text-sm font-semibold text-safety" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink placeholder:text-ink-mute/70 focus:border-accent focus:outline-none focus-visible:outline-3 focus-visible:outline-accent";

export function OnboardingFlow() {
  const router = useRouter();
  const { hydrated, profile, settings, saveProfile } = useProfile();
  const todayKey = useTodayKey();
  // 완료 직후 프로필 저장 → /today 자동 이동이 끼어들지 않도록
  const [completing, setCompleting] = useState(false);
  const ids = { nick: useId(), y: useId(), m: useId(), d: useId(), date: useId(), time: useId(), place: useId() };

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [place, setPlace] = useState(SEOUL.name);
  const [gender, setGender] = useState<GenderChoice>("none");
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && profile && !completing) router.replace("/today");
  }, [hydrated, profile, completing, router]);

  if (!hydrated || (profile && !completing)) return <LoadingView label="확인 중이에요" />;

  const dateCheck = validateBirthDate(y, m, d, todayKey);
  const isoForPicker = dateCheck.iso ?? "";

  function onPickerChange(v: string) {
    const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!mm) return;
    setY(String(Number(mm[1])));
    setM(String(Number(mm[2])));
    setD(String(Number(mm[3])));
    setDateError(null);
  }

  function next1() {
    if (dateCheck.error) {
      setDateError(dateCheck.error);
      return;
    }
    setDateError(null);
    setStep(2);
  }

  function next2() {
    if (!timeUnknown && !/^\d{2}:\d{2}$/.test(time)) {
      setTimeError("태어난 시간을 입력하거나 '시간을 몰라요'를 선택해 주세요.");
      return;
    }
    setTimeError(null);
    setStep(3);
  }

  function buildProfile(): StoredProfile | null {
    if (!dateCheck.iso) return null;
    const city = CITIES.find((c) => c.name === place) ?? SEOUL;
    const birth: BirthInput = {
      date: dateCheck.iso,
      time: timeUnknown ? null : time,
      gender: gender === "none" ? null : gender,
      longitude: place === ABROAD ? SEOUL.longitude : city.longitude,
      placeName: place === ABROAD ? "해외/모름(서울 기준 계산)" : city.name,
    };
    const now = new Date().toISOString();
    return {
      birth,
      nickname: nickname.trim().slice(0, 20),
      placeChoice: place,
      consent: { agreed: true, version: CONSENT_VERSION, at: now },
      aiEnabled,
      createdAt: now,
    };
  }

  function persistAndGo(p: StoredProfile) {
    setCompleting(true);
    if (!saveProfile(p)) {
      setCompleting(false);
      setCalcError("이 브라우저에 저장하지 못했어요. 비공개 모드이거나 저장 공간이 부족할 수 있어요.");
      return;
    }
    router.replace("/me");
  }

  function finish() {
    if (!agreed) {
      setAgreeError("안내 내용을 확인하고 동의해 주세요.");
      return;
    }
    setAgreeError(null);
    const p = buildProfile();
    if (!p) {
      setStep(1);
      return;
    }
    try {
      computeChart(toEngineInput(p, settings));
    } catch (e) {
      setCalcError(errorMessage(e));
      return;
    }
    persistAndGo(p);
  }

  // ───────── 첫 화면 ─────────
  if (step === 0) {
    return (
      <main className="pt-safe pb-safe flex min-h-dvh flex-col px-6">
        <div className="flex flex-1 flex-col justify-center py-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-accent-deep">AI 명리 코치</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight text-ink">
            결<span className="ml-1 text-3xl font-semibold text-ink-soft">(結)</span>
          </h1>
          <p className="mt-6 text-xl font-semibold leading-snug text-ink">
            미래를 맞히기보다,
            <br />
            내 패턴을 이해하고 선택을 돕습니다.
          </p>
          <p className="mt-3 text-base text-ink-soft">
            사주 계산은 코드가 정확히 하고, AI 는 그 결과를 쉬운 말로 설명해요. 모든 해석에는 &lsquo;왜?&rsquo; 근거가 함께
            있어요.
          </p>
          <ul className="mt-6 space-y-2 text-base text-ink-soft">
            <li>· 나의 핵심 패턴 카드</li>
            <li>· 오늘의 한 가지 흐름과 행동</li>
            <li>· 내 사주를 바탕으로 AI 에게 묻기</li>
          </ul>
        </div>
        <div className="space-y-3 pb-6">
          <p className="text-center text-sm font-semibold text-accent-deep">2분이면 충분해요</p>
          <Button block onClick={() => setStep(1)} aria-label="시작하기: 생년월일 입력으로 이동">
            시작하기
          </Button>
          <p className="text-center text-sm text-ink-mute">
            이 서비스는 AI 가 생성·보조한 해석을 제공합니다. 데이터는 이 브라우저에만 저장돼요.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col">
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between text-sm text-ink-mute">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="min-h-11 rounded-xl pr-3 font-semibold text-accent-deep"
            aria-label="이전 단계로"
          >
            ← 이전
          </button>
          <span aria-live="polite">{step} / 3 단계</span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-deep"
          role="progressbar"
          aria-label="온보딩 진행"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 space-y-6 px-5 py-6">
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">언제 태어나셨나요?</h1>
              <p className="mt-1 text-ink-soft">양력 기준이에요. 실명은 필요 없어요.</p>
            </div>
            <Field label="부를 이름 (선택)" htmlFor={ids.nick} hint="별칭이면 충분해요. 비워 둬도 괜찮아요.">
              <input
                id={ids.nick}
                className={inputCls}
                value={nickname}
                maxLength={20}
                autoComplete="off"
                placeholder="예: 바다"
                onChange={(e) => setNickname(e.target.value)}
              />
            </Field>
            <fieldset className="space-y-1.5">
              <legend className="text-base font-semibold text-ink">생년월일 (양력)</legend>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                <div>
                  <label htmlFor={ids.y} className="sr-only">
                    년
                  </label>
                  <div className="relative">
                    <input
                      id={ids.y}
                      className={cx(inputCls, "pr-8")}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="1990"
                      value={y}
                      aria-invalid={Boolean(dateError)}
                      onChange={(e) => setY(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute">
                      년
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <label htmlFor={ids.m} className="sr-only">
                    월
                  </label>
                  <input
                    id={ids.m}
                    className={cx(inputCls, "pr-8")}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="5"
                    value={m}
                    aria-invalid={Boolean(dateError)}
                    onChange={(e) => setM(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute">월</span>
                </div>
                <div className="relative">
                  <label htmlFor={ids.d} className="sr-only">
                    일
                  </label>
                  <input
                    id={ids.d}
                    className={cx(inputCls, "pr-8")}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="17"
                    value={d}
                    aria-invalid={Boolean(dateError)}
                    onChange={(e) => setD(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute">일</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <label htmlFor={ids.date} className="text-sm text-ink-mute">
                  또는 달력에서 선택
                </label>
                <input
                  id={ids.date}
                  type="date"
                  min={`${MIN_YEAR}-01-01`}
                  max={todayKey || undefined}
                  value={isoForPicker}
                  onChange={(e) => onPickerChange(e.target.value)}
                  className="min-h-11 flex-1 rounded-xl border border-line bg-white px-3 text-base"
                />
              </div>
              {dateError && (
                <p className="text-sm font-semibold text-safety" role="alert">
                  {dateError}
                </p>
              )}
            </fieldset>
            <Button block onClick={next1}>
              다음
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">태어난 시간과 장소</h1>
              <p className="mt-1 text-ink-soft">모르는 항목이 있어도 괜찮아요.</p>
            </div>
            <Field
              label="태어난 시간"
              htmlFor={ids.time}
              error={timeError}
              hint={
                timeUnknown
                  ? "시간 없이 계산해요. 네 기둥 중 시주(태어난 시간의 기둥)는 비워 두고 나머지로 해석해요."
                  : "시계 기준 시간을 입력하면 출생지 경도와 당시 표준시·서머타임을 반영해 보정해요."
              }
            >
              <input
                id={ids.time}
                type="time"
                className={cx(inputCls, timeUnknown && "opacity-50")}
                value={time}
                disabled={timeUnknown}
                aria-invalid={Boolean(timeError)}
                onChange={(e) => {
                  setTime(e.target.value);
                  setTimeError(null);
                }}
              />
            </Field>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4">
              <input
                type="checkbox"
                className="h-5 w-5 accent-accent"
                checked={timeUnknown}
                onChange={(e) => {
                  setTimeUnknown(e.target.checked);
                  setTimeError(null);
                }}
              />
              <span className="text-base text-ink">시간을 몰라요</span>
            </label>

            <Field
              label="태어난 곳"
              htmlFor={ids.place}
              hint={
                place === ABROAD
                  ? "해외 출생지는 아직 지원하지 않아요. 서울 경도로 계산하고, 계산 상세에 이 사실을 표시해요."
                  : "출생지 경도로 평균태양시를 보정해요."
              }
            >
              <select id={ids.place} className={inputCls} value={place} onChange={(e) => setPlace(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value={ABROAD}>해외 / 모름</option>
              </select>
            </Field>

            <fieldset className="space-y-1.5">
              <legend className="text-base font-semibold text-ink">성별</legend>
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {(
                  [
                    ["female", "여성"],
                    ["male", "남성"],
                    ["none", "선택 안 함"],
                  ] as const
                ).map(([v, label]) => (
                  <label
                    key={v}
                    className={cx(
                      "flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border text-base",
                      gender === v ? "border-accent bg-accent-soft font-semibold text-accent-deep" : "border-line bg-white",
                    )}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={v}
                      checked={gender === v}
                      onChange={() => setGender(v)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="text-sm text-ink-mute">
                10년 단위 흐름(대운)의 방향 계산에만 사용해요.
                {gender === "none" && " 선택하지 않으면 대운은 생략돼요."}
              </p>
            </fieldset>
            <Button block onClick={next2}>
              다음
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">시작 전에 꼭 알아 주세요</h1>
              <p className="mt-1 text-ink-soft">신뢰할 수 있는 해석을 위해 지키는 원칙이에요.</p>
            </div>
            <Card className="space-y-3">
              <ol className="space-y-3 text-base text-ink">
                <li className="flex gap-3">
                  <Num n={1} />
                  <span>
                    <b>계산은 코드가, 설명은 AI 가.</b> 사주 계산은 정해진 규칙의 프로그램이 하고, AI 는 그 결과를 설명만 해요.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Num n={2} />
                  <span>
                    <b>AI 가 생성한 해석이에요.</b> 전통 명리 관점의 설명이며 확정적인 예측이 아니에요.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Num n={3} />
                  <span>
                    <b>데이터는 이 브라우저에만 저장돼요.</b> 서버에 보관하지 않으며, 설정에서 한 번에 모두 지울 수 있어요.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Num n={4} />
                  <span>
                    <b>중요한 결정의 근거로 쓰지 마세요.</b> 질병·사망·임신·투자·채용·법률 문제는 사주로 판단하지 않고 전문가와
                    상의해 주세요.
                  </span>
                </li>
              </ol>
            </Card>

            <div className="space-y-1.5">
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
                  checked={agreed}
                  aria-invalid={Boolean(agreeError)}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    setAgreeError(null);
                  }}
                />
                <span className="text-base text-ink">
                  위 내용을 확인했고 동의해요 <span className="text-safety">(필수)</span>
                </span>
              </label>
              {agreeError && (
                <p className="text-sm font-semibold text-safety" role="alert">
                  {agreeError}
                </p>
              )}
            </div>

            <Card>
              <Switch
                checked={aiEnabled}
                onChange={setAiEnabled}
                label="AI 질문 기능 사용"
                description="켜면 질문할 때 출생 입력과 계산 결과, 질문이 이 앱의 서버로 전송돼요(저장하지 않아요). 설정에서 언제든 끌 수 있어요."
              />
            </Card>

            {calcError && (
              <Card className="border-caution/30 bg-caution-soft/60" role="alert">
                <p className="font-semibold text-ink">계산 중 문제가 생겼어요</p>
                <p className="mt-1 text-sm text-ink-soft">{calcError}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={finish}>
                    다시 시도
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const p = buildProfile();
                      if (p) persistAndGo(p);
                    }}
                  >
                    입력은 저장하고 계속
                  </Button>
                </div>
              </Card>
            )}

            <Button block onClick={finish} aria-label="동의하고 나의 결 확인하기">
              <IconShield size={20} />
              나의 결 확인하기
            </Button>
            <Notice>이 서비스는 AI 가 생성·보조한 해석을 제공합니다. 목업 프로토타입이며 서버 저장은 없어요.</Notice>
          </>
        )}
      </div>
    </main>
  );
}

function Num({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-deep"
    >
      {n}
    </span>
  );
}
