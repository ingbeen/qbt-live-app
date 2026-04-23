import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS } from '../utils/colors';

// 폼 필드 검증 에러 표시 컴포넌트.
// visible (= attempted 플래그) 이 true 이고 message 가 존재할 때만 노출한다.
// FillForm / AdjustForm 등 폼 컴포넌트에서 공통으로 사용.
interface Props {
  visible: boolean;
  message: string | undefined;
}

export const FieldError: React.FC<Props> = ({ visible, message }) =>
  visible && message ? <Text style={styles.error}>{message}</Text> : null;

const styles = StyleSheet.create({
  error: {
    color: COLORS.red,
    fontSize: 11,
    marginTop: 4,
  },
});
