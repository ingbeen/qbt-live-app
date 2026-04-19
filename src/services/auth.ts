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
  const cred = await signInWithEmailAndPassword(getAuth(), email, password);
  useStore.getState().setUser({
    uid: cred.user.uid,
    email: cred.user.email,
  });
};

export const signOut = async (): Promise<void> => {
  await fbSignOut(getAuth());
  useStore.getState().clearAll();
  useStore.getState().setUser(null);
};

export const subscribeAuthState = (
  onChange: (user: AuthUser | null) => void,
): (() => void) => {
  return onAuthStateChanged(getAuth(), (fbUser) => {
    if (fbUser) {
      onChange({ uid: fbUser.uid, email: fbUser.email });
    } else {
      onChange(null);
    }
  });
};
