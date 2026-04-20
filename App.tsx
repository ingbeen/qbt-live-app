import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
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
  setupForegroundHandler,
  setupNotificationTapHandler,
} from './src/services/fcm';
import { useStore } from './src/store/useStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
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

  useEffect(() => {
    initFirebase();
    const unsubAuth = subscribeAuthState((u) =>
      useStore.getState().setUser(u),
    );
    return () => {
      unsubAuth();
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
