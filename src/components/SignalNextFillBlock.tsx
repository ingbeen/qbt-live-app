import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import {
  MARGIN_MD,
  PADDING_SM,
  RADIUS_MD,
  SYMBOLS,
} from '../utils/constants';
import type { AssetId, PendingOrder, Signal } from '../types/rtdb';
import {
  directionLabel,
  formatPendingShares,
  listPendingOrders,
  toUpperTicker,
} from '../utils/format';

interface Props {
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
  signals: Record<AssetId, Signal>;
}

export const SignalNextFillBlock: React.FC<Props> = ({
  pendingOrders,
  signals,
}) => {
  const pendings = listPendingOrders(pendingOrders);

  if (pendings.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        시그널 {SYMBOLS.ARROW_RIGHT} 다음 거래일 체결 예정
      </Text>
      {pendings.map((p) => {
        const sharesText = formatPendingShares(
          p.delta_amount,
          signals[p.asset_id].close,
        );
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
    borderRadius: RADIUS_MD,
    padding: PADDING_SM,
    marginBottom: MARGIN_MD,
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
