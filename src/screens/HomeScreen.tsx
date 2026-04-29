import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../utils/colors';
import { MARGIN_MD } from '../utils/constants';
import { useStore } from '../store/useStore';
import { PullToRefreshScrollView } from '../components/PullToRefreshScrollView';
import { UpdateStatusBadge } from '../components/UpdateStatusBadge';
import { PendingOrdersListBlock } from '../components/PendingOrdersListBlock';
import { AssetSummaryCard } from '../components/AssetSummaryCard';
import { MAProximityCard } from '../components/MAProximityCard';
import { ModelCompareCard } from '../components/ModelCompareCard';
import { SyncDialog } from '../components/SyncDialog';
import { Toast } from '../components/Toast';
import { ErrorState } from '../components/ErrorState';

interface ContentProps {
  onPullRefresh: () => void;
}

const HomeScreenContent: React.FC<ContentProps> = ({ onPullRefresh }) => {
  const portfolio = useStore(s => s.portfolio);
  const signals = useStore(s => s.signals);
  const pendingOrders = useStore(s => s.pendingOrders);
  const inboxFills = useStore(s => s.inboxFills);
  const inboxFillDismiss = useStore(s => s.inboxFillDismiss);
  const loading = useStore(s => s.loading);
  const lastError = useStore(s => s.lastError);
  const lastToast = useStore(s => s.lastToast);
  const refreshHome = useStore(s => s.refreshHome);
  const submitModelSync = useStore(s => s.submitModelSync);
  const hideToast = useStore(s => s.hideToast);

  const [dialogVisible, setDialogVisible] = useState(false);

  const isLoadingHome = loading.home === true;

  useEffect(() => {
    refreshHome();
  }, [refreshHome]);

  const onSyncPress = useCallback(() => {
    setDialogVisible(true);
  }, []);

  const onRetry = useCallback(() => {
    refreshHome();
  }, [refreshHome]);

  const onSyncCancel = useCallback(() => {
    setDialogVisible(false);
  }, []);

  const onSyncConfirm = useCallback(async () => {
    setDialogVisible(false);
    await submitModelSync();
  }, [submitModelSync]);

  if (portfolio === null && isLoadingHome) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (portfolio === null) {
    return (
      <ErrorState
        message={lastError ?? '데이터가 없습니다.'}
        onRetry={onRetry}
      />
    );
  }

  return (
    <View style={styles.root}>
      <PullToRefreshScrollView
        refreshing={isLoadingHome}
        onRefresh={onPullRefresh}
        contentContainerStyle={styles.content}
      >
        {lastError ? <Text style={styles.errorBanner}>{lastError}</Text> : null}

        <UpdateStatusBadge executionDate={portfolio.execution_date} />

        {signals ? (
          <>
            <PendingOrdersListBlock
              mode="remind"
              pendingOrders={pendingOrders}
              signals={signals}
              inboxFills={inboxFills}
              inboxFillDismiss={inboxFillDismiss}
            />

            <PendingOrdersListBlock
              mode="next"
              pendingOrders={pendingOrders}
              signals={signals}
            />

            <AssetSummaryCard
              portfolio={portfolio}
              signals={signals}
              pendingOrders={pendingOrders}
            />

            <MAProximityCard signals={signals} />
          </>
        ) : null}

        <ModelCompareCard portfolio={portfolio} onSyncPress={onSyncPress} />
      </PullToRefreshScrollView>

      <SyncDialog
        visible={dialogVisible}
        onCancel={onSyncCancel}
        onConfirm={onSyncConfirm}
        pendingOrders={pendingOrders}
        signals={signals}
      />

      <Toast message={lastToast} onClose={hideToast} />
    </View>
  );
};

// Outer: PTR 시 도메인 캐시를 비우고 Content 를 리마운트하여 모든 로컬 state 를
// 첫 진입처럼 리셋한다. (브라우저 새로고침 동작과 동등)
export const HomeScreen: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const onPullRefresh = useCallback(() => {
    useStore.getState().clearHomeCache();
    setRefreshKey(k => k + 1);
  }, []);
  return <HomeScreenContent key={refreshKey} onPullRefresh={onPullRefresh} />;
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
    paddingHorizontal: 24,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorBanner: {
    color: COLORS.red,
    fontSize: 13,
    marginBottom: MARGIN_MD,
    textAlign: 'center',
  },
});
