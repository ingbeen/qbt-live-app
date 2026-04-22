import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from '@react-native-firebase/auth';
import { useStore, type AuthUser } from '../store/useStore';

export const signIn = async (
  email: string,
  password: string,
): Promise<void> => {
  // user 상태는 onAuthStateChanged 가 단일 SoT 로 업데이트한다.
  // signIn 내 수동 setUser 는 중복 호출을 유발하여 ensureFcmToken 이 2회 실행되고
  // onTokenRefresh 리스너가 누적되는 부작용이 있어 제거.
  await signInWithEmailAndPassword(getAuth(), email, password);
};

export const signOut = async (): Promise<void> => {
  await fbSignOut(getAuth());
  const store = useStore.getState();
  store.clearAll();
  store.setUser(null);
  store.setDeviceId(null);
  store.setFcmRegistered(false);
};

export const subscribeAuthState = (
  onChange: (user: AuthUser | null) => void,
): (() => void) => {
  // Firebase Auth 는 자동 로그인 시 같은 user 로 2회 방출 (로컬 복원 → 토큰 refresh).
  // uid + email 동일하면 중복으로 간주해 무시한다. user 를 구독하는 useEffect 가
  // 매 앱 재시작마다 2회 발동되어 ensureFcmToken / onTokenRefresh 가 누적되는 것 방지.
  let lastUid: string | null = null;
  let lastEmail: string | null = null;
  return onAuthStateChanged(getAuth(), (fbUser) => {
    const uid = fbUser ? fbUser.uid : null;
    const email = fbUser ? fbUser.email : null;
    if (uid === lastUid && email === lastEmail) return;
    lastUid = uid;
    lastEmail = email;
    onChange(fbUser ? { uid: fbUser.uid, email: fbUser.email } : null);
  });
};
