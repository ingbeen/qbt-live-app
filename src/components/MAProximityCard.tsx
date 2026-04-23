import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { ASSETS, MARGIN_MD, PADDING_MD, RADIUS_MD } from '../utils/constants';
import type { AssetId, Signal } from '../types/rtdb';
import { formatSignedPct, toSignalTicker } from '../utils/format';

interface Props {
  signals: Record<AssetId, Signal>;
}

export const MAProximityCard: React.FC<Props> = ({ signals }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>MA 근접도 (200일선)</Text>
      <View style={styles.divider} />
      {ASSETS.map((id) => {
        const pct = signals[id].ma_distance_pct;
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
    borderRadius: RADIUS_MD,
    padding: PADDING_MD,
    marginBottom: MARGIN_MD,
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
