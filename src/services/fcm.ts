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
import uuid from 'react-native-uuid';
import { submitDeviceToken } from './rtdb';
import { useStore } from '../store/useStore';

// device_id 는 메모리 전용. 앱 재시작 시 새 UUID 로 재등록되며
// 서버가 invalid 토큰을 자동 정리한다(§8.2.10).
let cachedDeviceId: string | null = null;

const getDeviceId = (): string => {
  if (!cachedDeviceId) cachedDeviceId = uuid.v4() as string;
  return cachedDeviceId;
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
  const deviceId = getDeviceId();
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
