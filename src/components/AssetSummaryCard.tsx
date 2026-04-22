import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { ASSETS } from '../utils/constants';
import type {
  AssetId,
  AssetSnapshot,
  PendingOrder,
  Portfolio,
  Signal,
} from '../types/rtdb';
import {
  formatShares,
  formatUSDInt,
  formatWeight,
  toUpperTicker,
} from '../utils/format';
import { Badge } from './Badge';

interface Props {
  portfolio: Portfolio;
  signals: Record<AssetId, Signal> | null;
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
}

type BadgeDef = { text: string; color: string };

const getAssetBadge = (
  snap: AssetSnapshot,
  pending: PendingOrder | undefined,
): BadgeDef => {
  if (pending) {
    return pending.delta_amount > 0
      ? { text: '매수대기', color: COLORS.accent }
      : { text: '매도대기', color: COLORS.red };
  }
  if (snap.actual_shares > 0) return { text: '보유', color: COLORS.green };
  return { text: '현금', color: COLORS.sub };
};

export const AssetSummaryCard: React.FC<Props> = ({
  portfolio,
  signals,
  pendingOrders,
}) => {
  const totalEquity = portfolio.actual_equity;
  const cashWeight =
    totalEquity > 0 ? portfolio.shared_cash_actual / totalEquity : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>자산 현황</Text>
        <Text style={styles.cardAmount}>{formatUSDInt(totalEquity)}</Text>
      </View>

      <View style={styles.divider} />

      {ASSETS.map((id) => {
        const snap = portfolio.assets[id];
        const pending = pendingOrders?.[id];
        const badge = getAssetBadge(snap, pending);
        const close = signals?.[id]?.close;
        const hasPrice = close !== undefined && close > 0;
        const valueUSD = hasPrice ? snap.actual_shares * close : 0;
        const weight = hasPrice && totalEquity > 0 ? valueUSD / totalEquity : null;

        return (
          <View key={id} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.ticker}>{toUpperTicker(id)}</Text>
              <Badge text={badge.text} color={badge.color} />
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowShares}>
                {formatShares(snap.actual_shares)}
              </Text>
              <Text style={styles.rowWeight}>
                {weight !== null ? formatWeight(weight) : '-'}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.ticker}>현금</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowShares}>
            {formatUSDInt(portfolio.shared_cash_actual)}
          </Text>
          <Text style={styles.rowWeight}>{formatWeight(cashWeight)}</Text>
        </View>
      </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  cardAmount: {
    color: COLORS.text,
    fontSize: 18,
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
    paddingVertical: 6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  ticker: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  rowShares: {
    color: COLORS.text,
    fontSize: 12,
  },
  rowWeight: {
    color: COLORS.sub,
    fontSize: 10,
    marginTop: 2,
  },
});
