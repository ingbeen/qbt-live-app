import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { ASSETS } from '../utils/constants';
import type { AssetId, Signal } from '../types/rtdb';
import { formatSignedPct, toSignalTicker } from '../utils/format';

interface Props {
  signals: Record<AssetId, Signal> | null;
}

export const MAProximityCard: React.FC<Props> = ({ signals }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>MA 근접도 (200일선)</Text>
      <View style={styles.divider} />
      {ASSETS.map((id) => {
        const pct = signals?.[id]?.ma_distance_pct ?? 0;
        const color = pct >= 0 ? COLORS.green : COLORS.red;
        return (
          <View key={id} style={styles.row}>
            <Text style={styles.leftLabel}>{toSignalTicker(id)}</Text>
            <Text style={[styles.rightValue, { color }]}>
              {formatSignedPct(pct)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  leftLabel: {
    color: COLORS.sub,
    fontSize: 12,
  },
  rightValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
