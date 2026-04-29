import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../store/useStore';
import { signOut } from '../services/auth';
import { Badge } from '../components/Badge';
import { PullToRefreshScrollView } from '../components/PullToRefreshScrollView';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import { APP_VERSION, PADDING_MD, RADIUS_MD } from '../utils/constants';

interface RowProps {
  label: string;
  value?: string;
  badge?: { text: string; color: string };
}

const Row: React.FC<RowProps> = ({ label, value, badge }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueWrap}>
      {value !== undefined && <Text style={styles.value}>{value}</Text>}
      {badge && <Badge text={badge.text} color={badge.color} />}
    </View>
  </View>
);

interface ContentProps {
  onPullRefresh: () => void;
}

const SettingsScreenContent: React.FC<ContentProps> = ({ onPullRefresh }) => {
  const user = useStore(s => s.user);
  const portfolio = useStore(s => s.portfolio);
  const fcmRegistered = useStore(s => s.fcmRegistered);
  const refreshHome = useStore(s => s.refreshHome);
  const isLoadingHome = useStore(s => s.loading.home === true);
  const [signingOut, setSigningOut] = useState(false);

  // mount 시 portfolio 캐시가 비어있으면 즉시 재로드 (PTR 직후 RTDB 배지가 "오류"
  // 로 잠시 표시되는 것을 최소화). 다른 탭에서 이미 로드되어 있으면 skip.
  useEffect(() => {
    if (portfolio === null) refreshHome();
  }, [portfolio, refreshHome]);

  // portfolio 가 로드된 상태면 RTDB 연결 정상. lastError 는 체결 저장 실패 등 다른 경로에서도
  // 세팅되므로 연결 상태 판정에서 제외.
  const rtdbBadge =
    portfolio != null
      ? { text: '정상', color: COLORS.green }
      : { text: '오류', color: COLORS.red };

  const fcmBadge = fcmRegistered
    ? { text: '등록됨', color: COLORS.green }
    : { text: '미등록', color: COLORS.red };

  const lastRunValue = portfolio ? portfolio.execution_date : '-';

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error('[auth] signOut failed:', e);
      useStore.getState().setLastError('로그아웃 중 오류가 발생했습니다.');
      setSigningOut(false);
    }
  }, [signingOut]);

  return (
    <PullToRefreshScrollView
      refreshing={isLoadingHome}
      onRefresh={onPullRefresh}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <Row label="계정" value={user?.email ?? '-'} />
        <Row label="Firebase" value="qbt-live (Spark)" />
        <Row label="RTDB 연결" badge={rtdbBadge} />
        <Row label="FCM 토큰" badge={fcmBadge} />
        <Row label="마지막 실행" value={lastRunValue} />
        <Row label="앱 버전" value={APP_VERSION} />
      </View>

      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        style={({ pressed }) => [
          styles.signOutBtn,
          pressed && styles.signOutBtnPressed,
          signingOut && styles.signOutBtnDisabled,
        ]}
      >
        {signingOut ? (
          <ActivityIndicator color={COLORS.red} />
        ) : (
          <Text style={styles.signOutText}>로그아웃</Text>
        )}
      </Pressable>
    </PullToRefreshScrollView>
  );
};

// Outer: PTR 시 home 캐시를 비우고 Content 를 리마운트하여 signingOut 등 모든
// 로컬 state 를 첫 진입처럼 리셋.
export const SettingsScreen: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const onPullRefresh = useCallback(() => {
    useStore.getState().clearHomeCache();
    setRefreshKey(k => k + 1);
  }, []);
  return (
    <SettingsScreenContent key={refreshKey} onPullRefresh={onPullRefresh} />
  );
};

const styles = StyleSheet.create({
  content: {
    padding: PADDING_MD,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomColor: COLORS.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    color: COLORS.sub,
    fontSize: 14,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  value: {
    color: COLORS.text,
    fontSize: 14,
    textAlign: 'right',
  },
  signOutBtn: {
    marginTop: 20,
    borderColor: COLORS.red,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnPressed: {
    backgroundColor: COLOR_PRESETS.redPressed,
  },
  signOutBtnDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: '600',
  },
});
