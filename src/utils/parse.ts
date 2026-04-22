// 폼 입력(체결/보정) 에서 공통으로 쓰는 파싱 헬퍼.
// 빈 문자열 / 유효하지 않은 입력은 undefined 로 변환하여 상위의 Partial<Payload> 흐름에 맞춘다.

export const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseIntOrUndefined = (s: string): number | undefined => {
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
};

export const parseFloatOrUndefined = (s: string): number | undefined => {
  if (!s) return undefined;
  const n = parseFloat(s);
  return Number.isNaN(n) ? undefined : n;
};
