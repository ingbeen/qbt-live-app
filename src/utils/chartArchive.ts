// 다음으로 로드가 필요한 archive 연도를 반환한다. 없으면 null.
// recent 의 첫 날짜와 이미 로드된 archive 연도 목록을 기준으로 "바로 뒤로
// 붙여야 할 1개 연도" 만 결정한다. 초기 로드(loadedYears=[])와 좌측 스크롤
// 로드 양쪽에서 동일 규칙을 공유하기 위한 순수 함수.
//
// 규칙:
//   1) firstDate 가 빈 값/파싱 실패 → null (호출부에서 경고 + 사용자 에러 토스트)
//   2) recentFirstYear 가 loadedYears 에 없고 recent 가 해당 연도 1/1 부터가
//      아니며 archiveYears 에 포함 → recentFirstYear
//      (recent 앞쪽의 같은 연도 구간을 채우기 위함)
//   3) 그 외 Math.min(recentFirstYear, ...loadedYears) - 1 이 archiveYears 에
//      포함 → 해당 전년도
//   4) 어느 조건도 해당 안 되면 null (더 로드할 데이터 없음)
export const computeNextArchiveYear = (
  firstDate: string | undefined,
  archiveYears: number[],
  loadedYears: number[],
): number | null => {
  if (!firstDate) return null;
  const recentFirstYear = parseInt(firstDate.slice(0, 4), 10);
  if (Number.isNaN(recentFirstYear)) return null;

  const coversFullYear = firstDate === `${recentFirstYear}-01-01`;
  const firstYearLoaded = loadedYears.includes(recentFirstYear);
  if (
    !coversFullYear &&
    !firstYearLoaded &&
    archiveYears.includes(recentFirstYear)
  ) {
    return recentFirstYear;
  }

  const earliestLoaded = Math.min(recentFirstYear, ...loadedYears);
  const candidate = earliestLoaded - 1;
  return archiveYears.includes(candidate) ? candidate : null;
};
