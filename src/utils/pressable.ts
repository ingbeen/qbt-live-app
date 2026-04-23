import type { ViewStyle } from 'react-native';

// Pressable 눌림 상태의 공용 투명도. 전 앱 공통 톤 통일.
export const PRESSED_OPACITY = 0.7;

// Pressable style prop 에서 pressed 상태를 받아 눌림 표현 스타일을 반환.
// 사용: <Pressable style={({ pressed }) => [styles.btn, pressedOpacity(pressed)]} />
export const pressedOpacity = (pressed: boolean): ViewStyle | null =>
  pressed ? { opacity: PRESSED_OPACITY } : null;
