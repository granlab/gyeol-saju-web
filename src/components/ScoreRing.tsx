import { cx } from "./ui";

/**
 * 0~100 점수 링. 점수는 예측이 아니라 '주의 배분 지표' — 호출하는 쪽에서 반드시 그 고지를 함께 보여 준다.
 */
export function ScoreRing({
  value,
  label,
  caption,
  size = 92,
  stroke = 7,
  className,
}: {
  value: number;
  /** 접근성 라벨(예: '관계 주의 배분 72') */
  label: string;
  /** 숫자 아래 작은 글자(예: '관계') */
  caption?: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? Math.round(value) : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;
  return (
    <div
      className={cx("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0cd84" />
            <stop offset="1" stopColor="#e2a55e" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-paper-deep)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[1.75rem] font-bold tabular-nums text-ink">{v}</span>
        <span className="mt-0.5 text-[0.65rem] font-semibold text-ink-mute">{caption ?? "/100"}</span>
      </div>
    </div>
  );
}
