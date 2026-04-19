import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { ASSETS, SYMBOLS } from '../utils/constants';
import type { AssetId, PendingOrder, Signal } from '../types/rtdb';
import type { InboxItem } from '../services/rtdb';
import { toUpperTicker } from '../utils/format';

interface Props {
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
  inboxFills: InboxItem[] | null;
  inboxFillDismiss: InboxItem[] | null;
  signals: Record<AssetId, Signal> | null;
}

const hasInboxForAsset = (
  items: InboxItem[] | null,
  assetId: AssetId,
): boolean =>
  !!items?.some(
    (it) => (it.data as { asset_id?: string }).asset_id === assetId,
  );

const directionLabel = (delta: number): string =>
  delta > 0 ? '매수' : '매도';

export const ReminderBlock: React.FC<Props> = ({
  pendingOrders,
  inboxFills,
  inboxFillDismiss,
  signals,
}) => {
  const pendingsToRemind = ASSETS.flatMap((id) => {
    const p = pendingOrders?.[id];
    if (!p) return [];
    if (hasInboxForAsset(inboxFills, id)) return [];
    if (hasInboxForAsset(inboxFillDismiss, id)) return [];
    return [p];
  });

  if (pendingsToRemind.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {SYMBOLS.WARN} 미입력 체결 리마인더
      </Text>
      {pendingsToRemind.map((p) => {
        const close = signals?.[p.asset_id]?.close;
        const sharesText =
          close && close > 0
            ? `${Math.round(Math.abs(p.delta_amount) / close)}주 `
            : '';
        return (
          <Text key={p.asset_id} style={styles.line}>
            {toUpperTicker(p.asset_id)} {sharesText}
            {directionLabel(p.delta_amount)} ({p.signal_date} 시그널)
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.orange + '22',
    borderColor: COLORS.orange + '70',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    color: COLORS.orange,
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
