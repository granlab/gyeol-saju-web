import {
  BRANCHES,
  BRANCHES_KO,
  ELEMENT_KO,
  STEMS,
  STEMS_KO,
  type Element,
  type Pillar,
  type PillarKey,
  type SajuChart,
} from "@/lib/saju/types";
import { ELEMENT_BG } from "@/lib/format";
import { cx } from "../ui";

/** 시·일·월·년 순 (오른쪽이 년주) */
const ORDER: PillarKey[] = ["hour", "day", "month", "year"];
const LABEL: Record<PillarKey, string> = { hour: "시", day: "일", month: "월", year: "년" };

function stemKo(s: string) {
  const i = (STEMS as readonly string[]).indexOf(s);
  return i >= 0 ? STEMS_KO[i] : "";
}
function branchKo(b: string) {
  const i = (BRANCHES as readonly string[]).indexOf(b);
  return i >= 0 ? BRANCHES_KO[i] : "";
}

function Glyph({ hanja, ko, element, tenGod }: { hanja: string; ko: string; element: Element; tenGod?: string | null }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2">
      <span className="font-display text-[2rem] font-bold leading-none text-ink" lang="zh-Hant">
        {hanja}
      </span>
      <span className="flex items-center gap-1 text-sm text-ink-soft">
        <span className={cx("inline-block h-2.5 w-2.5 rounded-full", ELEMENT_BG[element])} aria-hidden="true" />
        {ko}
        <span className="sr-only">, {ELEMENT_KO[element]}</span>
      </span>
      {tenGod !== undefined && <span className="text-xs text-ink-mute">{tenGod ?? "일간(나)"}</span>}
    </div>
  );
}

export function PillarTable({ chart }: { chart: SajuChart }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <table className="w-full table-fixed border-collapse text-center">
        <caption className="sr-only">사주 원국 표: 왼쪽부터 시주, 일주, 월주, 년주</caption>
        <thead>
          <tr className="bg-paper-deep text-sm text-ink-soft">
            {ORDER.map((k) => (
              <th key={k} scope="col" className={cx("py-1.5 font-semibold", k === "day" && "text-accent-deep")}>
                {LABEL[k]}주{k === "day" && <span className="ml-0.5 text-xs">(나)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            {ORDER.map((k) => {
              const p: Pillar | null = chart.pillars[k];
              return (
                <td key={k} className={cx(k === "day" && "bg-accent-soft/50")}>
                  {p ? (
                    <Glyph hanja={p.stem} ko={stemKo(p.stem)} element={p.stemElement} tenGod={p.stemTenGod} />
                  ) : (
                    <UnknownCell />
                  )}
                </td>
              );
            })}
          </tr>
          <tr>
            {ORDER.map((k) => {
              const p: Pillar | null = chart.pillars[k];
              return (
                <td key={k} className={cx(k === "day" && "bg-accent-soft/50")}>
                  {p ? (
                    <Glyph hanja={p.branch} ko={branchKo(p.branch)} element={p.branchElement} tenGod={p.branchTenGod} />
                  ) : (
                    <UnknownCell />
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function UnknownCell() {
  return (
    <div className="flex min-h-[5.5rem] flex-col items-center justify-center text-sm text-ink-mute">
      <span aria-hidden="true" className="text-2xl leading-none">
        ?
      </span>
      시간 미상
    </div>
  );
}
