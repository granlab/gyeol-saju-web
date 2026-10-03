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
import { NightSky, Wordmark } from "../NightSky";
import { Button, Card, Notice, Switch, cx } from "../ui";
import {
  IconArrowRight,
  IconCalendar,
  IconChevron,
  IconChevronLeft,
  IconClock,
  IconMapPin,
  IconShield,
  IconSparkle,
} from "../icons";

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

function FieldLabel({
  children,
  hint,
  htmlFor,
  as = "label",
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  as?: "label" | "legend" | "span";
}) {
  const cls = "flex flex-wrap items-baseline gap-x-1.5 text-base font-bold text-ink";
  const inner = (
    <>
      {children}
      {hint && <span className="text-sm font-normal text-ink-mute">{hint}</span>}
    </>
  );
  if (as === "legend") return <legend className={cls}>{inner}</legend>;
  if (as === "span") return <span className={cls}>{inner}</span>;
  return (
    <label htmlFor={htmlFor} className={cls}>
      {inner}
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold text-safety" role="alert">
      {children}
    </p>
  );
}

const inputCls =
  "min-h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-ink placeholder:text-ink-mute/70 focus:border-accent focus:bg-white focus:outline-none focus-visible:outline-2 focus-visible:outline-accent";

export function OnboardingFlow() {
  const router = useRouter();
  const { hydrated, profile, settings, saveProfile } = useProfile();
  const todayKey = useTodayKey();
  // 완료 직후 프로필 저장 → /today 자동 이동이 끼어들지 않도록
  const [completing, setCompleting] = useState(false);
  const ids = { nick: useId(), y: useId(), m: useId(), d: useId(), date: useId(), time: useId(), place: useId() };

  const [step, setStep] = useState<1 | 2>(1);
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

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

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

  /** 1단계: 생년월일·시간 검증 후 고지 단계로 */
  function next1() {
    let ok = true;
    if (dateCheck.error) {
      setDateError(dateCheck.error);
      ok = false;
    } else setDateError(null);
    if (!timeUnknown && !/^\d{2}:\d{2}$/.test(time)) {
      setTimeError("태어난 시간을 입력하거나 '모름'을 선택해 주세요.");
      ok = false;
    } else setTimeError(null);
    if (ok) setStep(2);
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

  // ───────── 1단계: 밤하늘 히어로 + 입력 시트 ─────────
  if (step === 1) {
    return (
      <main className="flex min-h-dvh flex-col">
        <NightSky variant="hero" className="pt-safe">
          <div className="flex flex-col items-center px-6 pb-14 pt-7 text-center">
            <Wordmark />
            <p className="mt-7 text-xl font-semibold leading-snug text-white">
              당신의 결이 빛나는
              <br />
              오늘을 만나보세요.
            </p>
            <p className="mt-2 text-sm text-night-text">내 패턴을 이해하고 선택을 돕는 AI 명리 코치</p>
          </div>
        </NightSky>

        <section
          aria-labelledby="ob-title"
          className="relative -mt-8 flex-1 rounded-t-[2rem] bg-white px-5 pb-10 pt-6 shadow-[0_-12px_32px_rgba(72,54,140,0.14)]"
        >
          <div className="text-center">
            <h1 id="ob-title" className="text-xl font-bold text-ink">
              기본 정보를 입력해 주세요
            </h1>
            <p className="mt-1 text-sm text-ink-mute">정확한 해석을 위해 사용돼요 · 이 브라우저에만 저장</p>
          </div>

          <div className="mt-5 space-y-4">
            {/* 별칭 */}
            <div className="space-y-1.5">
              <FieldLabel htmlFor={ids.nick} hint="(선택)">
                부를 이름
              </FieldLabel>
              <input
                id={ids.nick}
                className={inputCls}
                value={nickname}
                maxLength={20}
                autoComplete="off"
                placeholder="예: 바다 — 별칭이면 충분해요"
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* 생년월일 */}
            <fieldset className="space-y-1.5">
              <FieldLabel as="legend" hint="(양력)">
                생년월일
              </FieldLabel>
              <div
                className={cx(
                  "flex min-h-12 items-stretch rounded-2xl border bg-paper focus-within:border-accent focus-within:bg-white",
                  dateError ? "border-safety/60" : "border-line",
                )}
              >
                <DatePart id={ids.y} label="년" placeholder="1995" value={y} max={4} onChange={setY} invalid={Boolean(dateError)} grow />
                <DatePart id={ids.m} label="월" placeholder="5" value={m} max={2} onChange={setM} invalid={Boolean(dateError)} />
                <DatePart id={ids.d} label="일" placeholder="21" value={d} max={2} onChange={setD} invalid={Boolean(dateError)} />
                <div className="relative flex w-12 shrink-0 items-center justify-center rounded-r-2xl border-l border-line text-accent-deep has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent">
                  <IconCalendar size={22} />
                  <input
                    id={ids.date}
                    type="date"
                    aria-label="달력에서 생년월일 선택"
                    min={`${MIN_YEAR}-01-01`}
                    max={todayKey || undefined}
                    value={isoForPicker}
                    onChange={(e) => onPickerChange(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>
              <p className="text-sm text-ink-mute">음력 변환은 준비 중이에요. 양력 날짜로 입력해 주세요.</p>
              {dateError && <FieldError>{dateError}</FieldError>}
            </fieldset>

            {/* 출생 시간 */}
            <div className="space-y-1.5">
              <FieldLabel htmlFor={ids.time} hint="(모르면 모름 선택)">
                출생 시간
              </FieldLabel>
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <IconClock size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />
                  <input
                    id={ids.time}
                    type="time"
                    className={cx(inputCls, "pl-11", timeUnknown && "text-ink-mute/60")}
                    value={time}
                    disabled={timeUnknown}
                    aria-invalid={Boolean(timeError)}
                    onChange={(e) => {
                      setTime(e.target.value);
                      setTimeError(null);
                    }}
                  />
                </div>
                <label
                  className={cx(
                    "flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-2xl border px-4 text-base",
                    timeUnknown ? "border-accent/50 bg-accent-soft font-semibold text-accent-deep" : "border-line bg-paper text-ink",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-accent"
                    checked={timeUnknown}
                    onChange={(e) => {
                      setTimeUnknown(e.target.checked);
                      setTimeError(null);
                    }}
                  />
                  모름
                </label>
              </div>
              <p className="text-sm text-ink-mute">
                {timeUnknown
                  ? "시간 없이 계산해요. 네 기둥 중 시주는 비워 두고 나머지로 해석해요."
                  : "시계 기준 시간이면 돼요. 출생지 경도와 당시 표준시·서머타임을 반영해 보정해요."}
              </p>
              {timeError && <FieldError>{timeError}</FieldError>}
            </div>

            {/* 출생지 */}
            <div className="space-y-1.5">
              <FieldLabel htmlFor={ids.place}>태어난 곳</FieldLabel>
              <div className="relative">
                <IconMapPin size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />
                <select id={ids.place} className={cx(inputCls, "appearance-none pl-11 pr-10")} value={place} onChange={(e) => setPlace(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value={ABROAD}>해외 / 모름</option>
                </select>
                <IconChevron size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute" />
              </div>
              {place === ABROAD && (
                <p className="text-sm text-ink-mute">해외 출생지는 아직 지원하지 않아요. 서울 경도로 계산하고 계산 상세에 표시해요.</p>
              )}
            </div>

            {/* 성별 */}
            <fieldset className="space-y-1.5">
              <FieldLabel as="legend" hint="(선택사항)">
                성별
              </FieldLabel>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="성별">
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
                      "flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border text-base transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent",
                      gender === v ? "border-accent/50 bg-accent-soft font-semibold text-accent-deep" : "border-line bg-paper text-ink",
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
                10년 단위 흐름(대운)의 방향 계산에만 써요.{gender === "none" && " 선택하지 않으면 대운은 생략돼요."}
              </p>
            </fieldset>
          </div>

          <div className="mt-8 space-y-3">
            <Button block onClick={next1} aria-label="내 사주 보기: 안내 확인 단계로 이동">
              내 사주 보기
              <IconArrowRight size={20} />
            </Button>
            <p className="text-center text-xs leading-relaxed text-ink-mute">
              AI 가 생성·보조한 해석을 제공해요 · 데이터는 서버가 아닌 이 브라우저에만 저장돼요
              <br />
              다음 화면에서 네 가지 원칙을 확인하고 동의하면 바로 결과를 볼 수 있어요.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // ───────── 2단계: 고지·동의 ─────────
  return (
    <main className="flex min-h-dvh flex-col">
      <NightSky variant="band" className="pt-safe">
        <div className="px-5 pb-10 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              aria-label="이전 단계(기본 정보 입력)로"
            >
              <IconChevronLeft size={20} />
              이전
            </button>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white" aria-live="polite">
              2 / 2 단계
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">시작 전에 꼭 알아 주세요</h1>
          <p className="mt-1 text-base text-night-text">신뢰할 수 있는 해석을 위해 지키는 네 가지 원칙이에요.</p>
        </div>
      </NightSky>

      <div className="relative -mt-6 flex-1 space-y-4 px-5 pb-10">
        <Card>
          <ol className="space-y-3.5 text-base text-ink">
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
                <b>데이터는 이 브라우저에만 저장돼요.</b> 서버에 보관하지 않으며, 마이 화면에서 한 번에 모두 지울 수 있어요.
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
          <label
            className={cx(
              "flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-card",
              agreed ? "border-accent/50" : "border-white",
            )}
          >
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
              위 내용을 확인했고 동의해요 <span className="font-semibold text-safety">(필수)</span>
            </span>
          </label>
          {agreeError && <FieldError>{agreeError}</FieldError>}
        </div>

        <Card>
          <Switch
            checked={aiEnabled}
            onChange={setAiEnabled}
            label="AI 상담 기능 사용"
            description="켜면 질문할 때 출생 입력과 계산 결과, 질문이 AI 에 전달돼요(저장하지 않아요). 마이 화면에서 언제든 끌 수 있어요."
          />
        </Card>

        {calcError && (
          <Card className="border-caution/30 bg-caution-soft/70" role="alert">
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

        <div className="space-y-3 pt-2">
          <Button block onClick={finish} aria-label="동의하고 나의 결 확인하기">
            <IconShield size={20} />
            나의 결 확인하기
          </Button>
          <p className="flex items-center justify-center gap-1 text-center text-sm font-semibold text-accent-deep">
            <IconSparkle size={16} />
            30초 안에 내 사주 핵심 요약을 만나요
          </p>
          <Notice>이 서비스는 AI 가 생성·보조한 해석을 제공합니다. 목업 프로토타입이며 서버 저장은 없어요.</Notice>
        </div>
      </div>
    </main>
  );
}

function DatePart({
  id,
  label,
  placeholder,
  value,
  max,
  onChange,
  invalid,
  grow,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  invalid: boolean;
  grow?: boolean;
}) {
  return (
    <div className={cx("relative flex items-center", grow ? "flex-[1.4]" : "flex-1")}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        className="min-h-12 w-full bg-transparent pl-4 pr-7 text-base text-ink placeholder:text-ink-mute/60 focus:outline-none"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={max}
        placeholder={placeholder}
        value={value}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, max))}
      />
      <span className="pointer-events-none absolute right-2 text-sm text-ink-mute" aria-hidden="true">
        {label}
      </span>
    </div>
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
