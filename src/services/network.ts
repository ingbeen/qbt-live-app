import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useStore } from '../store/useStore';

// Android 에서 isInternetReachable 이 null 일 수 있으므로 !== false 패턴 사용.
const isOnline = (state: NetInfoState): boolean =>
  !!state.isConnected && state.isInternetReachable !== false;

export const setupNetworkListener = (): (() => void) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    useStore.getState().setOnline(isOnline(state));
  });
  // addEventListener 가 초기 이벤트를 보장하지 않는 경우가 있어 명시적 fetch 로 초기 상태 확정.
  NetInfo.fetch()
    .then((state) => useStore.getState().setOnline(isOnline(state)))
    .catch((e) => console.error('[network] initial fetch failed:', e));
  return unsubscribe;
};

export const refreshNetworkState = async (): Promise<void> => {
  await NetInfo.refresh();
};
