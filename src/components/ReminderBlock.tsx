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
import type { InboxItem } from '../services/rtdb';
import {
  directionLabel,
  formatPendingShares,
  listPendingOrders,
  toUpperTicker,
} from '../utils/format';

interface Props {
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
  inboxFills: InboxItem[] | null;
  inboxFillDismiss: InboxItem[] | null;
  signals: Record<AssetId, Signal>;
}

const hasInboxForAsset = (
  items: InboxItem[] | null,
  assetId: AssetId,
): boolean =>
  !!items?.some(
    (it) => (it.data as { asset_id?: string }).asset_id === assetId,
  );

export const ReminderBlock: React.FC<Props> = ({
  pendingOrders,
  inboxFills,
  inboxFillDismiss,
  signals,
}) => {
  const pendingsToRemind = listPendingOrders(pendingOrders).filter(
    (p) =>
      !hasInboxForAsset(inboxFills, p.asset_id) &&
      !hasInboxForAsset(inboxFillDismiss, p.asset_id),
  );

  if (pendingsToRemind.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {SYMBOLS.WARN} 미입력 체결 리마인더
      </Text>
      {pendingsToRemind.map((p) => {
        const sharesText = formatPendingShares(
          p.delta_amount,
          signals[p.asset_id].close,
        );
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
    backgroundColor: COLOR_PRESETS.orangeBg,
    borderColor: COLOR_PRESETS.orangeBorder,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    padding: PADDING_SM,
    marginBottom: MARGIN_MD,
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
