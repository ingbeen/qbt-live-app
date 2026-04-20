import NetInfo from '@react-native-community/netinfo';
import { useStore } from '../store/useStore';

// Android 에서 isInternetReachable 이 null 일 수 있으므로 !== false 패턴 사용(§12.1).
export const setupNetworkListener = (): (() => void) =>
  NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    useStore.getState().setOnline(online);
  });

export const refreshNetworkState = async (): Promise<void> => {
  await NetInfo.refresh();
};
