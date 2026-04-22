import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { STALE_WARNING_DAYS } from '../utils/constants';
import { today } from '../utils/format';
import { Badge } from './Badge';

interface Props {
  executionDate: string;
}

// 두 날짜의 달력일 차이. 주말/공휴일을 거래일로 계산하지 않으므로 STALE_WARNING_DAYS 는
// 주말 2일 + 공휴일 여유를 포함한 값이어야 의미가 있다.
const daysBetween = (isoA: string, isoB: string): number => {
  const a = new Date(isoA + 'T00:00:00+09:00').getTime();
  const b = new Date(isoB + 'T00:00:00+09:00').getTime();
  return Math.floor((b - a) / 86_400_000);
};

export const UpdateStatusBadge: React.FC<Props> = ({ executionDate }) => {
  const diff = daysBetween(executionDate, today());
  const badge =
    diff > STALE_WARNING_DAYS
      ? { text: '경고', color: COLORS.yellow }
      : { text: '정상', color: COLORS.green };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>업데이트: {executionDate}</Text>
      <Badge text={badge.text} color={badge.color} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  label: {
    color: COLORS.sub,
    fontSize: 11,
  },
});
