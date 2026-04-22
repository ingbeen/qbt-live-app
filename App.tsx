import React, { useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { initFirebase } from './src/services/firebase';
import { subscribeAuthState } from './src/services/auth';
import {
  ensureFcmToken,
  requestNotificationPermission,
  setupForegroundHandler,
  setupNotificationTapHandler,
} from './src/services/fcm';
import { setupNetworkListener } from './src/services/network';
import { useStore } from './src/store/useStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineScreen } from './src/components/OfflineScreen';
import { COLORS } from './src/utils/colors';

// Bottom Tab root param list. 4탭 이름은 AppNavigator 와 일치(§15).
export type RootTabParamList = {
  '홈': undefined;
  '차트': undefined;
  '거래': undefined;
  '설정': undefined;
};

const navigationRef = createNavigationContainerRef<RootTabParamList>();

// FCM 알림 탭 시 호출. ready 상태가 아니면 무시(§10.1 정책: 항상 홈 이동).
const navigateHome = (): void => {
  if (navigationRef.isReady()) {
    navigationRef.navigate('홈');
  }
};

export default function App() {
  const user = useStore((s) => s.user);
  const isOnline = useStore((s) => s.isOnline);

  useEffect(() => {
    initFirebase();
    // 앱 시작 시점에 알림 권한 다이얼로그 표시 (Android 13+).
    // 첫 설치 후 최초 실행에서만 시스템 다이얼로그 노출. FCM 토큰 등록은
    // 로그인 후 ensureFcmToken 이 담당 (관심사 분리).
    requestNotificationPermission().catch((e) =>
      console.error('[fcm] permission request failed:', e),
    );
    const unsubAuth = subscribeAuthState((u) =>
      useStore.getState().setUser(u),
    );
    const unsubNet = setupNetworkListener();

    // 포그라운드 복귀 시 캐시 무효화 + 홈 재로드(§12.4).
    // user 가 없으면 LoginScreen 표시 중이므로 스킵. clearAll 은 user/isOnline/deviceId 유지.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const st = useStore.getState();
      if (!st.user) return;
      st.clearAll();
      st.refreshHome();
    });

    return () => {
      unsubAuth();
      unsubNet();
      appStateSub.remove();
    };
  }, []);

  // 로그인 이후에만 FCM 토큰 등록 + 알림 핸들러 구독. 로그아웃 시 cleanup.
  useEffect(() => {
    if (!user) return;
    ensureFcmToken().catch((e) =>
      console.error('[fcm] ensure failed:', e),
    );
    const unsubFg = setupForegroundHandler();
    const unsubTap = setupNotificationTapHandler(navigateHome);
    return () => {
      unsubFg();
      unsubTap();
    };
  }, [user]);

  // 오프라인 상태면 전체 차단(§12.2). 로그인/앱 화면 모두 숨김.
  if (!isOnline) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
          <OfflineScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <NavigationContainer ref={navigationRef}>
          {user ? <AppNavigator /> : <LoginScreen />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
