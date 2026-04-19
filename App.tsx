import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { initFirebase } from './src/services/firebase';
import { subscribeAuthState } from './src/services/auth';
import { useStore } from './src/store/useStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/colors';

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <NavigationContainer>
          {user ? <AppNavigator /> : <LoginScreen />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
