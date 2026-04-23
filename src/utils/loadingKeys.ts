import type { AssetId } from '../types/rtdb';
import type { ChartTarget } from '../store/useStore';

// useStore.loading 플래그 키 생성 헬퍼. 문자열 오타 방지 + 단일 변경점.

export const LOADING_HOME = 'home';
export const LOADING_TRADE = 'trade';

export const chartLoadingKey = (target: ChartTarget): string =>
  `chart_${target}`;

export const priceArchiveLoadingKey = (
  assetId: AssetId,
  year: number,
): string => `chart_archive_${assetId}_${year}`;

export const equityArchiveLoadingKey = (year: number): string =>
  `chart_archive_equity_${year}`;
