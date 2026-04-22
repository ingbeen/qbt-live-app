export const COLORS = {
  bg: '#0d1117',
  card: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  sub: '#8b949e',

  accent: '#58a6ff',
  green: '#3fb950',
  red: '#f85149',
  yellow: '#d29922',
  orange: '#db6d28',

  toastBg: '#1a3a26',
  toastBorder: '#3fb950',
  toastText: '#e8ffe8',
  toastClose: '#a8d8b3',
} as const;

// 6자리 hex 색상에 2자리 alpha 를 붙여 #rrggbbaa 형식으로 리턴. alphaHex 는 '00'~'ff'.
// StyleSheet 에서 투명도 조합이 필요할 때 문자열 연결 대신 사용.
export const withAlpha = (color: string, alphaHex: string): string =>
  `${color}${alphaHex}`;

// 자주 쓰는 투명도 프리셋. 동일 패턴이 여러 컴포넌트에 흩어져 있으므로 프리셋으로 모음.
export const COLOR_PRESETS = {
  accentMuted: withAlpha(COLORS.accent, '22'),
  accentBorder: withAlpha(COLORS.accent, '55'),
  accentBg: withAlpha(COLORS.accent, '1e'),
  greenMuted: withAlpha(COLORS.green, '22'),
  redMuted: withAlpha(COLORS.red, '22'),
  redPressed: withAlpha(COLORS.red, '11'),
  orangeBg: withAlpha(COLORS.orange, '22'),
  orangeBorder: withAlpha(COLORS.orange, '70'),
  gridLine: withAlpha(COLORS.border, '22'),
  // 모달 배경 오버레이. withAlpha 는 hex 전제라 rgba 문자열로 별도 정의.
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
} as const;
