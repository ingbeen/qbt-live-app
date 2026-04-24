import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

// Android 에서 isInternetReachable 이 null 일 수 있으므로 !== false 패턴 사용 (CLAUDE.md §6.6).
const isOnline = (state: NetInfoState): boolean =>
  !!state.isConnected && state.isInternetReachable !== false;

// 네트워크 상태 변화 콜백을 받아 구독. store 갱신은 호출부가 콜백 내부에서 담당
// (services 의 순수 I/O 역할 분리, CLAUDE.md §17.3).
export const setupNetworkListener = (
  onChange: (online: boolean) => void,
): (() => void) => {
  const unsubscribe = NetInfo.addEventListener(state => {
    onChange(isOnline(state));
  });
  // addEventListener 가 초기 이벤트를 보장하지 않는 경우가 있어 명시적 fetch 로 초기 상태 확정.
  NetInfo.fetch()
    .then(state => onChange(isOnline(state)))
    .catch(e => console.error('[network] initial fetch failed:', e));
  return unsubscribe;
};

export const refreshNetworkState = async (): Promise<void> => {
  await NetInfo.refresh();
};
