import { ELEMENTS, ELEMENT_KO, ELEMENT_PLAIN_KO, type SajuChart } from "@/lib/saju/types";
import { ELEMENT_BG, TEN_GOD_GROUPS, TEN_GOD_GROUP_DESC } from "@/lib/format";
import { Bar } from "../ui";

export function ElementBars({ chart }: { chart: SajuChart }) {
  const { weighted, counts, dominant, missing } = chart.elements;
  return (
    <div>
      <ul className="space-y-2.5">
        {ELEMENTS.map((el) => {
          const v = weighted[el] ?? 0;
          return (
            <li key={el} className="grid grid-cols-[5.5rem_1fr_2.75rem] items-center gap-2">
              <span className="text-sm text-ink">
                {ELEMENT_KO[el]}
                <span className="ml-1 text-xs text-ink-mute">{ELEMENT_PLAIN_KO[el]}</span>
              </span>
              <Bar value={v} colorClass={ELEMENT_BG[el]} label={`${ELEMENT_KO[el]} 비율 ${v}%`} />
              <span className="text-right text-sm tabular-nums text-ink-soft">{v}%</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-ink-mute">
        지장간까지 가중한 비율이에요. 글자 수:{" "}
        {ELEMENTS.map((el) => `${ELEMENT_PLAIN_KO[el]} ${counts[el] ?? 0}`).join(" · ")}
        {dominant.length > 0 && <> · 두드러짐: {dominant.map((e) => ELEMENT_PLAIN_KO[e]).join(", ")}</>}
        {missing.length > 0 && <> · 없음: {missing.map((e) => ELEMENT_PLAIN_KO[e]).join(", ")}</>}
      </p>
    </div>
  );
}

export function TenGodBars({ chart }: { chart: SajuChart }) {
  const { byGroup, dominantGroup } = chart.tenGods;
  return (
    <ul className="space-y-2">
      {TEN_GOD_GROUPS.map((g) => {
        const v = byGroup[g] ?? 0;
        return (
          <li key={g} className="grid grid-cols-[5.5rem_1fr_2.75rem] items-center gap-2">
            <span className="text-sm text-ink">
              {g}
              <span className="ml-1 text-xs text-ink-mute">{TEN_GOD_GROUP_DESC[g]}</span>
            </span>
            <Bar
              value={v}
              colorClass={g === dominantGroup ? "bg-accent" : "bg-ink-mute/50"}
              label={`${g} 비율 ${v}%`}
            />
            <span className="text-right text-sm tabular-nums text-ink-soft">{v}%</span>
          </li>
        );
      })}
    </ul>
  );
}
