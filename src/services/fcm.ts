import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import uuid from 'react-native-uuid';
import { submitDeviceToken } from './rtdb';
import { useStore } from '../store/useStore';

// device_id 는 /device_tokens/{device_id} 의 키. 설치 UUID 원칙
// (DESIGN_QBT_LIVE_FINAL.md §8.2.10). CLAUDE.md §12 의 AsyncStorage
// 금지는 RTDB 데이터 캐시 방지가 목적이며, 식별자 1개 저장은 예외 허용.
const DEVICE_ID_KEY = 'qbt_device_id';
// Promise 자체를 캐싱하여 동시 호출 시 AsyncStorage race 를 방지한다.
// 두 번째 호출은 첫 번째가 진행 중인 Promise 를 재사용 → 같은 uuid 보장.
let deviceIdPromise: Promise<string> | null = null;

const getDeviceId = (): Promise<string> => {
  if (deviceIdPromise) return deviceIdPromise;
  deviceIdPromise = (async () => {
    try {
      const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (stored) return stored;
    } catch (error) {
      console.warn('[fcm] AsyncStorage read failed, falling back to new UUID', error);
    }
    const fresh = uuid.v4() as string;
    try {
      await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
    } catch (error) {
      console.warn('[fcm] AsyncStorage write failed, device_id will not persist', error);
    }
    return fresh;
  })();
  return deviceIdPromise;
};

// 앱 시작 시점 (로그인 전) 에 알림 권한을 사용자에게 요청한다.
// Android 13+ (API 33+) 의 POST_NOTIFICATIONS 는 runtime 권한이라 PermissionsAndroid
// 로 직접 요청해야 시스템 다이얼로그가 뜬다 (Firebase messaging.requestPermission 은
// iOS 전용이라 Android 에서는 다이얼로그 없이 즉시 AUTHORIZED 를 반환).
// 첫 호출 시 다이얼로그 1회, 이후 호출은 이전 선택(허용/거부)을 그대로 반환.
// 토큰 등록과 분리하여 ensureFcmToken 은 로그인 이후 user 가 확정된 뒤에만 호출.
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  // Android 12 이하는 설치 시 자동 부여되므로 별도 요청 불필요
  return true;
};

// onTokenRefresh 구독을 모듈 레벨로 저장하여 재호출 시 이전 리스너를 해제.
// ensureFcmToken 이 로그아웃/재로그인 사이클마다 호출되면 여러 구독이 누적되는 것을 방지.
let tokenRefreshUnsub: (() => void) | null = null;

export const ensureFcmToken = async (): Promise<void> => {
  // Android 13+ 는 PermissionsAndroid.check 로 실제 권한 상태를 확인한다.
  // 권한이 없으면 토큰을 발급받아도 사용자에게 알림이 표시되지 않으므로 등록을 skip.
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (!granted) {
      console.warn('[fcm] notification permission denied');
      useStore.getState().setFcmRegistered(false);
      return;
    }
  }
  const messaging = getMessaging(getApp());
  const deviceId = await getDeviceId();
  try {
    const token = await getToken(messaging);
    await submitDeviceToken(deviceId, token);
    useStore.getState().setDeviceId(deviceId);
    useStore.getState().setFcmRegistered(true);
    console.debug('[fcm] token registered');
  } catch (e) {
    console.error('[fcm] token registration failed:', e);
    useStore.getState().setFcmRegistered(false);
    return;
  }
  // 이전 onTokenRefresh 구독이 있으면 해제 후 재등록.
  if (tokenRefreshUnsub) {
    tokenRefreshUnsub();
    tokenRefreshUnsub = null;
  }
  tokenRefreshUnsub = onTokenRefresh(messaging, async (newToken) => {
    try {
      await submitDeviceToken(deviceId, newToken);
      console.debug('[fcm] token refreshed');
    } catch (e) {
      console.error('[fcm] token refresh save failed:', e);
    }
  });
};

// MVP: 포그라운드 알림 무시(CLAUDE.md §6.5). 사용자는 pull-to-refresh 로 갱신.
export const setupForegroundHandler = (): (() => void) =>
  onMessage(getMessaging(getApp()), async () => {
    // intentionally empty — 인앱 알림 표시하지 않음
  });

// 백그라운드/종료 상태에서 알림 탭 → onTap() (§10 알림 탭은 홈 이동).
export const setupNotificationTapHandler = (
  onTap: () => void,
): (() => void) => {
  const messaging = getMessaging(getApp());
  const unsub = onNotificationOpenedApp(messaging, () => onTap());
  getInitialNotification(messaging)
    .then((msg) => {
      if (msg) onTap();
    })
    .catch((e) => console.error('[fcm] getInitialNotification failed:', e));
  return unsub;
};
