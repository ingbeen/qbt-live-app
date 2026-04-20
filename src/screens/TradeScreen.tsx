import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { COLORS } from '../utils/colors';
import { useStore } from '../store/useStore';
import { PullToRefreshScrollView } from '../components/PullToRefreshScrollView';
import { FillForm } from '../components/FillForm';
import { AdjustForm } from '../components/AdjustForm';
import { HistoryList } from '../components/HistoryList';
import { Toast } from '../components/Toast';

type Mode = 'fill' | 'adjust';

export const TradeScreen: React.FC = () => {
  const portfolio = useStore((s) => s.portfolio);
  const signals = useStore((s) => s.signals);
  const pendingOrders = useStore((s) => s.pendingOrders);
  const historyFills = useStore((s) => s.historyFills);
  const historyBalanceAdjusts = useStore((s) => s.historyBalanceAdjusts);
  const historySignals = useStore((s) => s.historySignals);
  const loading = useStore((s) => s.loading);
  const lastToast = useStore((s) => s.lastToast);
  const refreshHome = useStore((s) => s.refreshHome);
  const refreshTrade = useStore((s) => s.refreshTrade);
  const hideToast = useStore((s) => s.hideToast);

  const [mode, setMode] = useState<Mode>('fill');

  const isLoadingTrade = loading.trade === true;
  const needsHomeData = portfolio === null;

  useEffect(() => {
    if (needsHomeData) refreshHome();
    refreshTrade();
  }, [needsHomeData, refreshHome, refreshTrade]);

  const onRefresh = useCallback(() => {
    refreshHome();
    refreshTrade();
  }, [refreshHome, refreshTrade]);

  if (portfolio === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <PullToRefreshScrollView
        refreshing={isLoadingTrade}
        onRefresh={onRefresh}
        contentContainerStyle={styles.content}
      >
        <View style={styles.segment}>
          <Pressable
            style={({ pressed }) => [
              styles.segmentItem,
              mode === 'fill' && styles.segmentItemActive,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setMode('fill')}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'fill' && styles.segmentTextActive,
              ]}
            >
              체결
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.segmentItem,
              mode === 'adjust' && styles.segmentItemActive,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setMode('adjust')}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'adjust' && styles.segmentTextActive,
              ]}
            >
              보정
            </Text>
          </Pressable>
        </View>

        {mode === 'fill' ? (
          <FillForm
            portfolio={portfolio}
            signals={signals}
            pendingOrders={pendingOrders}
          />
        ) : (
          <AdjustForm portfolio={portfolio} />
        )}

        <HistoryList
          fills={historyFills}
          balanceAdjusts={historyBalanceAdjusts}
          signals={historySignals}
        />
      </PullToRefreshScrollView>

      <Toast message={lastToast} onClose={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: COLORS.accent + '22',
  },
  segmentText: {
    color: COLORS.sub,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.accent,
  },
});
