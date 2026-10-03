/**
 * 대운(10년 흐름) 방향 문구 (luck-cycle 카드). 첫/현재 대운 해석은 오늘의 흐름 담당.
 */
export const LUCK_DIRECTION_KO: Record<"forward" | "backward", string> = {
  forward: "순행",
  backward: "역행",
};

export const LUCK_COPY = {
  title: "10년 단위 큰 흐름",
  headline: (dirKo: string, startAge: number | null) =>
    startAge != null ? `${startAge}세 무렵부터 ${dirKo}하는 10년 흐름` : `${dirKo}하는 10년 흐름`,
  body: (dirKo: string, startAge: number | null) =>
    [
      "대운은 10년마다 바뀌는 삶의 배경 흐름으로, 같은 기질도 시기에 따라 다르게 드러날 수 있다는 관점입니다.",
      startAge != null
        ? `당신의 대운은 ${dirKo} 방향으로 계산되며, ${startAge}세 무렵부터 10년 단위로 흐름이 바뀌는 것으로 봅니다.`
        : `당신의 대운은 ${dirKo} 방향으로 계산됩니다.`,
      "흐름이 바뀌는 시점은 정해진 사건이 아니라, 관심과 에너지의 무게가 옮겨 가는 시기로 읽는 것을 권합니다.",
    ].join(" "),
  rule: "전통 명리에서는 년간의 음양과 성별로 대운의 순행·역행을 정하고, 출생일과 가까운 절기까지의 날 수로 시작 나이를 계산합니다.",
  context:
    "몇 년마다 관심사나 중요하게 여기는 것이 크게 바뀌어 왔다면, 그 변화를 이 큰 흐름과 나란히 놓고 돌아볼 수 있습니다.",
  suggestion: "지난 10년을 3~4개 구간으로 나눠 구간마다 가장 중요했던 것을 한 단어로 적어 보는 것을 제안합니다.",
  caveatExtra: "대운은 시기의 배경을 설명하는 틀이며 특정 사건을 정하지 않습니다.",
};
