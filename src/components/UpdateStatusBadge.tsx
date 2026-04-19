import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { today } from '../utils/format';
import { Badge } from './Badge';

interface Props {
  executionDate: string;
}

const daysBetween = (isoA: string, isoB: string): number => {
  const a = new Date(isoA + 'T00:00:00+09:00').getTime();
  const b = new Date(isoB + 'T00:00:00+09:00').getTime();
  return Math.floor((b - a) / 86_400_000);
};

export const UpdateStatusBadge: React.FC<Props> = ({ executionDate }) => {
  const diff = daysBetween(executionDate, today());
  const badge =
    diff > 4
      ? { text: '경고', color: COLORS.yellow }
      : { text: '정상', color: COLORS.green };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        업데이트: {executionDate} 07:30 KST
      </Text>
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
