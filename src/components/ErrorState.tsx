import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

// 홈/거래/차트 탭에서 데이터 로딩 실패 시 표시하는 공통 상태 화면(§12.5).
// 부분 실패(Toast + lastError 배너)가 아닌 전체 로드 실패 상황 전용.
export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Text style={styles.message}>{message}</Text>
    <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.7}>
      <Text style={styles.btnText}>다시 시도</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    color: COLORS.red,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  btn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
