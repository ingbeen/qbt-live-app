import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const ensureFcmToken = async (): Promise<void> => {
  const messaging = getMessaging(getApp());
  const status = await requestPermission(messaging);
  const enabled =
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL;
  if (!enabled) {
    console.warn('[fcm] notification permission denied');
    useStore.getState().setFcmRegistered(false);
    return;
  }
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
  onTokenRefresh(messaging, async (newToken) => {
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
