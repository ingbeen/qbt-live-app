import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { MS_PER_DAY, STALE_WARNING_DAYS } from '../utils/constants';
import { today } from '../utils/format';
import { Badge } from './Badge';

interface Props {
  executionDate: string;
}

// 두 날짜의 달력일 차이. execution_date (ET) 와 today() (KST) 의 1 일 TZ 오프셋 +
// 주말 2 일 + 공휴일 여유를 STALE_WARNING_DAYS 가 모두 흡수해야 의미가 있다.
const daysBetween = (isoA: string, isoB: string): number => {
  const a = new Date(isoA + 'T00:00:00+09:00').getTime();
  const b = new Date(isoB + 'T00:00:00+09:00').getTime();
  return Math.floor((b - a) / MS_PER_DAY);
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
