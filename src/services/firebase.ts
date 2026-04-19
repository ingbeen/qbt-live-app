import { getApp } from '@react-native-firebase/app';
import {
  getDatabase,
  setPersistenceEnabled,
} from '@react-native-firebase/database';

export const initFirebase = (): void => {
  const db = getDatabase(getApp());
  setPersistenceEnabled(db, false);
  console.debug('[firebase] initialized, persistence OFF');
};
