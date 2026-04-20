import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { SYMBOLS } from '../utils/constants';

export type LegendType = 'price' | 'equity';

interface ChartLegendProps {
  type: LegendType;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ type }) => {
  if (type === 'equity') {
    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          <LineSwatch color={COLORS.accent} solid />
          <Text style={styles.text}>Model</Text>
          <View style={styles.spacer} />
          <LineSwatch color={COLORS.green} solid={false} />
          <Text style={styles.text}>Actual</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <LineSwatch color={COLORS.accent} solid />
        <Text style={styles.text}>종가</Text>
        <View style={styles.spacer} />
        <LineSwatch color={COLORS.yellow} solid={false} />
        <Text style={styles.text}>EMA-200</Text>
        <View style={styles.spacer} />
        <LineSwatch color={COLORS.red} solid={false} />
        <Text style={styles.text}>상단밴드</Text>
        <View style={styles.spacer} />
        <LineSwatch color={COLORS.green} solid={false} />
        <Text style={styles.text}>하단밴드</Text>
      </View>
      <View style={[styles.row, styles.rowSecond]}>
        <Text style={[styles.marker, { color: COLORS.green }]}>
          {SYMBOLS.ARROW_UP}
        </Text>
        <Text style={styles.text}>매수시그널</Text>
        <View style={styles.spacer} />
        <Text style={[styles.marker, { color: COLORS.red }]}>
          {SYMBOLS.ARROW_DOWN}
        </Text>
        <Text style={styles.text}>매도시그널</Text>
        <View style={styles.spacer} />
        <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
        <Text style={styles.text}>내 매수</Text>
        <View style={styles.spacer} />
        <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
        <Text style={styles.text}>내 매도</Text>
      </View>
    </View>
  );
};

// 실선 / 점선 구분 스와치. 점선은 작은 dash 로 근사.
const LineSwatch: React.FC<{ color: string; solid: boolean }> = ({
  color,
  solid,
}) =>
  solid ? (
    <View style={[styles.lineSolid, { backgroundColor: color }]} />
  ) : (
    <View style={styles.lineDashed}>
      <View style={[styles.dash, { backgroundColor: color }]} />
      <View style={[styles.dash, { backgroundColor: color }]} />
      <View style={[styles.dash, { backgroundColor: color }]} />
    </View>
  );

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowSecond: {
    marginTop: 6,
  },
  text: {
    color: COLORS.sub,
    fontSize: 11,
    marginLeft: 4,
  },
  marker: {
    fontSize: 13,
    fontWeight: '700',
  },
  // 내 매수/매도 마커 — 글리프 폰트 의존 없이 View 로 그려 일관된 원형 표시.
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spacer: {
    width: 10,
  },
  lineSolid: {
    width: 16,
    height: 2,
  },
  lineDashed: {
    flexDirection: 'row',
    width: 16,
    justifyContent: 'space-between',
  },
  dash: {
    width: 4,
    height: 2,
  },
});
