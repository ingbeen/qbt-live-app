import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../store/useStore';
import { signOut } from '../services/auth';
import { Badge } from '../components/Badge';
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

export const SettingsScreen: React.FC = () => {
  const user = useStore(s => s.user);
  const portfolio = useStore(s => s.portfolio);
  const fcmRegistered = useStore(s => s.fcmRegistered);
  const [signingOut, setSigningOut] = useState(false);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
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
