import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../utils/colors';
import { RADIUS_MD, SYMBOLS } from '../utils/constants';
import { refreshNetworkState } from '../services/network';

// 네트워크 미연결 시 전체 화면 차단 (CLAUDE.md §6.6). isOnline===false 동안 App.tsx 가 이 화면만 렌더.
// 복귀 시 NetInfo 리스너가 setOnline(true) 를 호출하면 App.tsx 렌더 트리가 원래 화면으로 돌아감.
export const OfflineScreen: React.FC = () => {
  const [retrying, setRetrying] = useState(false);

  const onRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await refreshNetworkState();
    } catch (e) {
      console.error('[network] refresh failed:', e);
    } finally {
      setRetrying(false);
    }
  }, [retrying]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{SYMBOLS.WARN}</Text>
      <Text style={styles.title}>네트워크 없음</Text>
      <Text style={styles.sub}>연결 후 다시 시도</Text>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          retrying && styles.btnDisabled,
          pressed && !retrying && { opacity: 0.7 },
        ]}
        onPress={onRetry}
        disabled={retrying}
      >
        {retrying ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.btnText}>다시 시도</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 64,
    color: COLORS.yellow,
    marginBottom: 16,
    lineHeight: 72,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  sub: {
    color: COLORS.sub,
    fontSize: 14,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS_MD,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
