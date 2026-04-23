import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from '@react-native-firebase/auth';

export type AuthUser = {
  uid: string;
  email: string | null;
};

export const signIn = async (
  email: string,
  password: string,
): Promise<void> => {
  // user 상태는 onAuthStateChanged 가 단일 진입점이다. signIn 은 Firebase 에 인증만 맡기고
  // user 를 직접 설정하지 않는다 — 수동 setUser 는 ensureFcmToken 중복 호출로 이어진다.
  await signInWithEmailAndPassword(getAuth(), email, password);
};

// Firebase Auth 만 처리. store 초기화 / user 제거 등 상태 전환은 호출부가
// onSignOut 콜백에서 수행한다 (services 의 순수 I/O 역할 분리, CLAUDE.md §17.3).
export const signOut = async (): Promise<void> => {
  await fbSignOut(getAuth());
};

export const subscribeAuthState = (
  onChange: (user: AuthUser | null) => void,
): (() => void) => {
  // Firebase Auth 는 자동 로그인 시 같은 user 로 2회 방출할 수 있다 (로컬 복원 → 토큰 refresh).
  // uid + email 동일하면 중복으로 간주해 무시하여 구독 측의 useEffect 가 2회 발동되지 않게 한다.
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
