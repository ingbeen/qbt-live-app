import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import { ASSETS, SYMBOLS } from '../utils/constants';
import type { AssetId, PendingOrder, Signal } from '../types/rtdb';
import { directionLabel, toUpperTicker } from '../utils/format';

interface Props {
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
  signals: Record<AssetId, Signal> | null;
}

export const SignalNextFillBlock: React.FC<Props> = ({
  pendingOrders,
  signals,
}) => {
  const pendings = ASSETS.flatMap((id) => {
    const p = pendingOrders?.[id];
    return p ? [p] : [];
  });

  if (pendings.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        시그널 {SYMBOLS.ARROW_RIGHT} 다음 거래일 체결 예정
      </Text>
      {pendings.map((p) => {
        const close = signals?.[p.asset_id]?.close;
        const sharesText =
          close && close > 0
            ? `${Math.round(Math.abs(p.delta_amount) / close)}주 `
            : '';
        return (
          <Text key={p.asset_id} style={styles.line}>
            {toUpperTicker(p.asset_id)} {sharesText}
            {directionLabel(p.delta_amount)}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLOR_PRESETS.accentBg,
    borderColor: COLOR_PRESETS.accentBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  line: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 2,
  },
});
