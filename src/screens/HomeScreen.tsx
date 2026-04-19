import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../utils/colors';
import { useStore } from '../store/useStore';
import { PullToRefreshScrollView } from '../components/PullToRefreshScrollView';
import { UpdateStatusBadge } from '../components/UpdateStatusBadge';
import { ReminderBlock } from '../components/ReminderBlock';
import { SignalNextFillBlock } from '../components/SignalNextFillBlock';
import { AssetSummaryCard } from '../components/AssetSummaryCard';
import { MAProximityCard } from '../components/MAProximityCard';
import { ModelCompareCard } from '../components/ModelCompareCard';
import { SyncDialog } from '../components/SyncDialog';
import { Toast } from '../components/Toast';

export const HomeScreen: React.FC = () => {
  const portfolio = useStore((s) => s.portfolio);
  const signals = useStore((s) => s.signals);
  const pendingOrders = useStore((s) => s.pendingOrders);
  const inboxFills = useStore((s) => s.inboxFills);
  const inboxFillDismiss = useStore((s) => s.inboxFillDismiss);
  const loading = useStore((s) => s.loading);
  const lastError = useStore((s) => s.lastError);
  const lastToast = useStore((s) => s.lastToast);
  const refreshHome = useStore((s) => s.refreshHome);
  const submitModelSync = useStore((s) => s.submitModelSync);
  const hideToast = useStore((s) => s.hideToast);

  const [dialogVisible, setDialogVisible] = useState(false);

  const isLoadingHome = loading.home === true;

  useEffect(() => {
    refreshHome();
  }, [refreshHome]);

  const onRefresh = useCallback(() => {
    refreshHome();
  }, [refreshHome]);

  const onSyncPress = useCallback(() => {
    setDialogVisible(true);
  }, []);

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

  return (
    <View style={styles.root}>
      <PullToRefreshScrollView
        refreshing={isLoadingHome}
        onRefresh={onRefresh}
        contentContainerStyle={styles.content}
      >
        {lastError ? (
          <Text style={styles.errorBanner}>{lastError}</Text>
        ) : null}

        <UpdateStatusBadge executionDate={portfolio.execution_date} />

        <ReminderBlock
          pendingOrders={pendingOrders}
          inboxFills={inboxFills}
          inboxFillDismiss={inboxFillDismiss}
          signals={signals}
        />

        <SignalNextFillBlock
          pendingOrders={pendingOrders}
          signals={signals}
        />

        <AssetSummaryCard
          portfolio={portfolio}
          signals={signals}
          pendingOrders={pendingOrders}
        />

        <MAProximityCard signals={signals} />

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
});
