import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../utils/colors';
import { ASSETS } from '../utils/constants';
import type { AssetSnapshot, PendingOrder } from '../types/rtdb';
import {
  formatUSDInt,
  formatShares,
  formatWeight,
  toUpperTicker,
} from '../utils/format';
import { useStore } from '../store/useStore';
import { Badge } from '../components/Badge';
import { PullToRefreshScrollView } from '../components/PullToRefreshScrollView';

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

export const HomeScreen: React.FC = () => {
  const portfolio = useStore((s) => s.portfolio);
  const signals = useStore((s) => s.signals);
  const pendingOrders = useStore((s) => s.pendingOrders);
  const loading = useStore((s) => s.loading);
  const lastError = useStore((s) => s.lastError);
  const refreshHome = useStore((s) => s.refreshHome);

  const isLoadingHome = loading.home === true;

  useEffect(() => {
    refreshHome();
  }, [refreshHome]);

  const onRefresh = useCallback(() => {
    refreshHome();
  }, [refreshHome]);

  if (portfolio === null && isLoadingHome) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (portfolio === null) {
    return (
      <View style={styles.centerContainer}>
        {lastError ? (
          <Text style={styles.errorText}>{lastError}</Text>
        ) : (
          <Text style={styles.emptyText}>데이터가 없습니다.</Text>
        )}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalEquity = portfolio.actual_equity;
  const cashWeight =
    totalEquity > 0 ? portfolio.shared_cash_actual / totalEquity : 0;

  return (
    <PullToRefreshScrollView
      refreshing={isLoadingHome}
      onRefresh={onRefresh}
      contentContainerStyle={styles.content}
    >
      {lastError ? <Text style={styles.errorBanner}>{lastError}</Text> : null}

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
          const close = signals?.[id]?.close ?? 0;
          const valueUSD = snap.actual_shares * close;
          const weight = totalEquity > 0 ? valueUSD / totalEquity : 0;

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
                <Text style={styles.rowWeight}>{formatWeight(weight)}</Text>
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
    </PullToRefreshScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorBanner: {
    color: COLORS.red,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.sub,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
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
