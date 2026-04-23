import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import { MARGIN_MD, RADIUS_MD } from '../utils/constants';
import { pressedOpacity } from '../utils/pressable';
import { useStore } from '../store/useStore';
import { PullToRefreshScrollView } from '../components/PullToRefreshScrollView';
import { FillForm } from '../components/FillForm';
import { AdjustForm } from '../components/AdjustForm';
import { HistoryList } from '../components/HistoryList';
import { Toast } from '../components/Toast';
import { ErrorState } from '../components/ErrorState';

type Mode = 'fill' | 'adjust';

export const TradeScreen: React.FC = () => {
  const portfolio = useStore((s) => s.portfolio);
  const signals = useStore((s) => s.signals);
  const pendingOrders = useStore((s) => s.pendingOrders);
  const historyFills = useStore((s) => s.historyFills);
  const historyBalanceAdjusts = useStore((s) => s.historyBalanceAdjusts);
  const historySignals = useStore((s) => s.historySignals);
  const loading = useStore((s) => s.loading);
  const lastError = useStore((s) => s.lastError);
  const lastToast = useStore((s) => s.lastToast);
  const refreshHome = useStore((s) => s.refreshHome);
  const refreshTrade = useStore((s) => s.refreshTrade);
  const hideToast = useStore((s) => s.hideToast);

  const [mode, setMode] = useState<Mode>('fill');

  const isLoadingHome = loading.home === true;
  const isLoadingTrade = loading.trade === true;
  const needsHomeData = portfolio === null;

  // 마운트 시 거래 화면 전용 데이터(history) 1회 로드.
  useEffect(() => {
    refreshTrade();
  }, [refreshTrade]);

  // 홈 데이터가 비어있을 때만 홈 로드 (다른 탭에서 이미 로드됐으면 skip).
  useEffect(() => {
    if (needsHomeData) refreshHome();
  }, [needsHomeData, refreshHome]);

  const onRefresh = useCallback(() => {
    refreshHome();
    refreshTrade();
  }, [refreshHome, refreshTrade]);

  // portfolio 가 null 이고 로딩도 끝난 상태 = 로드 실패. 무한 스피너 방지.
  if (portfolio === null && !isLoadingHome && lastError) {
    return <ErrorState message={lastError} onRetry={refreshHome} />;
  }

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
              pressedOpacity(pressed),
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
              pressedOpacity(pressed),
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
    borderRadius: RADIUS_MD,
    padding: 4,
    marginBottom: MARGIN_MD,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: COLOR_PRESETS.accentMuted,
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
