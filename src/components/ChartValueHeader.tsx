import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { formatUSD } from '../utils/format';

// 크로스헤어 이동 / 초기 진입 시 차트 상단에 표시할 값 묶음.
// 필드는 전부 선택적: series 가 없거나 워밍업 구간(null) 이면 undefined.
export interface CrosshairValues {
  close?: number;
  ma?: number;
  upper?: number;
  lower?: number;
  model?: number;
  actual?: number;
}

interface ChartValueHeaderProps {
  type: 'price' | 'equity';
  date: string | null;
  values: CrosshairValues | null;
}

const formatOrDash = (v: number | undefined): string =>
  v === undefined ? '--' : formatUSD(v);

export const ChartValueHeader: React.FC<ChartValueHeaderProps> = ({
  type,
  date,
  values,
}) => {
  const dateText = date ?? '--';
  if (type === 'equity') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.date}>{dateText}</Text>
        <View style={styles.row}>
          <ValueItem
            label="Model"
            labelColor={COLORS.accent}
            value={formatOrDash(values?.model)}
          />
          <ValueItem
            label="Actual"
            labelColor={COLORS.green}
            value={formatOrDash(values?.actual)}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.date}>{dateText}</Text>
      <View style={styles.row}>
        <ValueItem
          label="종가"
          labelColor={COLORS.accent}
          value={formatOrDash(values?.close)}
        />
        <ValueItem
          label="EMA"
          labelColor={COLORS.yellow}
          value={formatOrDash(values?.ma)}
        />
        <ValueItem
          label="상단"
          labelColor={COLORS.red}
          value={formatOrDash(values?.upper)}
        />
        <ValueItem
          label="하단"
          labelColor={COLORS.green}
          value={formatOrDash(values?.lower)}
        />
      </View>
    </View>
  );
};

interface ValueItemProps {
  label: string;
  labelColor: string;
  value: string;
}

const ValueItem: React.FC<ValueItemProps> = ({ label, labelColor, value }) => (
  <View style={styles.item}>
    <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  date: {
    color: COLORS.sub,
    fontSize: 11,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  value: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
});
