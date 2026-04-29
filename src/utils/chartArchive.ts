// 다음으로 로드가 필요한 archive 연도를 반환한다. 없으면 null.
// 현재 가장 오래된 archive 의 첫 날짜와 이미 로드된 archive 연도 목록을 기준으로
// "바로 뒤로 붙여야 할 1개 연도" 만 결정한다. 좌측 스크롤 로드에서 사용된다.
//
// 규칙:
//   1) firstDate 가 빈 값/파싱 실패 → null (호출부에서 경고 + 사용자 에러 토스트)
//   2) firstYear 가 loadedYears 에 없고 firstDate 가 해당 연도 1/1 부터가
//      아니며 archiveYears 에 포함 → firstYear
//      (해당 연도 앞쪽 구간을 채우기 위함)
//   3) 그 외 Math.min(firstYear, ...loadedYears) - 1 이 archiveYears 에
//      포함 → 해당 전년도
//   4) 어느 조건도 해당 안 되면 null (더 로드할 데이터 없음)
export const computeNextArchiveYear = (
  firstDate: string | undefined,
  archiveYears: number[],
  loadedYears: number[],
): number | null => {
  if (!firstDate) return null;
  const firstYear = parseInt(firstDate.slice(0, 4), 10);
  if (Number.isNaN(firstYear)) return null;

  const coversFullYear = firstDate === `${firstYear}-01-01`;
  const firstYearLoaded = loadedYears.includes(firstYear);
  if (!coversFullYear && !firstYearLoaded && archiveYears.includes(firstYear)) {
    return firstYear;
  }

  const earliestLoaded = Math.min(firstYear, ...loadedYears);
  const candidate = earliestLoaded - 1;
  return archiveYears.includes(candidate) ? candidate : null;
};

// 앱 진입 시 받을 초기 archive 연도 목록을 결정한다.
// last_date 의 monthsBack 개월 이전 날짜가 속한 연도부터 last_date 의 연도까지를 후보로 두고,
// archiveYears 에 포함된 연도만 오름차순으로 반환한다.
//
// 규칙:
//   1) lastDate 파싱 실패 → []
//   2) target = lastDate - monthsBack months. JS Date 의 month overflow 자동 처리.
//   3) [targetYear, ..., lastYear] ∩ archiveYears 를 오름차순 반환
//
// 일반 케이스 (monthsBack=12):
//   - last_date 2026-04-28 → target 2025-04-28 → [2025, 2026]
//   - last_date 2026-01-02 → target 2025-01-02 → [2025, 2026]
export const computeInitialArchiveYears = (
  lastDate: string,
  archiveYears: number[],
  monthsBack: number = 12,
): number[] => {
  const lastYear = parseInt(lastDate.slice(0, 4), 10);
  const lastMonth = parseInt(lastDate.slice(5, 7), 10);
  const lastDay = parseInt(lastDate.slice(8, 10), 10);
  if (
    Number.isNaN(lastYear) ||
    Number.isNaN(lastMonth) ||
    Number.isNaN(lastDay)
  ) {
    return [];
  }
  const target = new Date(lastYear, lastMonth - 1 - monthsBack, lastDay);
  const targetYear = target.getFullYear();
  const archiveSet = new Set(archiveYears);
  const result: number[] = [];
  for (let y = targetYear; y <= lastYear; y += 1) {
    if (archiveSet.has(y)) result.push(y);
  }
  return result;
};
