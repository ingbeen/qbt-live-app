import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import {
  MARGIN_MD,
  PADDING_SM,
  RADIUS_MD,
  SYMBOLS,
} from '../utils/constants';
import type { AssetId, InboxItem, PendingOrder, Signal } from '../types/rtdb';
import {
  directionLabel,
  formatPendingShares,
  listPendingOrders,
  toUpperTicker,
} from '../utils/format';

// 홈 화면 두 개의 pending 블록 (리마인더 / 다음 체결 예정) 공용 컴포넌트.
// mode 로 필터링 / 톤 / 접미 문자열을 분기한다.
type Mode = 'remind' | 'next';

interface Props {
  mode: Mode;
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
  signals: Record<AssetId, Signal>;
  // remind 모드 전용: inbox 에 이미 입력된 자산은 리마인드하지 않는다.
  inboxFills?: InboxItem[] | null;
  inboxFillDismiss?: InboxItem[] | null;
}

const hasInboxForAsset = (
  items: InboxItem[] | null | undefined,
  assetId: AssetId,
): boolean =>
  !!items?.some(
    (it) => (it.data as { asset_id?: string }).asset_id === assetId,
  );

export const PendingOrdersListBlock: React.FC<Props> = ({
  mode,
  pendingOrders,
  signals,
  inboxFills,
  inboxFillDismiss,
}) => {
  const all = listPendingOrders(pendingOrders);
  const items =
    mode === 'remind'
      ? all.filter(
          (p) =>
            !hasInboxForAsset(inboxFills, p.asset_id) &&
            !hasInboxForAsset(inboxFillDismiss, p.asset_id),
        )
      : all;

  if (items.length === 0) return null;

  const isRemind = mode === 'remind';
  const wrapStyle = isRemind ? styles.wrapRemind : styles.wrapNext;
  const titleStyle = isRemind ? styles.titleRemind : styles.titleNext;
  const title = isRemind
    ? `${SYMBOLS.WARN} 미입력 체결 리마인더`
    : `시그널 ${SYMBOLS.ARROW_RIGHT} 다음 거래일 체결 예정`;

  return (
    <View style={wrapStyle}>
      <Text style={titleStyle}>{title}</Text>
      {items.map((p) => {
        const sharesText = formatPendingShares(
          p.delta_amount,
          signals[p.asset_id].close,
        );
        return (
          <Text key={p.asset_id} style={styles.line}>
            {toUpperTicker(p.asset_id)} {sharesText}
            {directionLabel(p.delta_amount)}
            {isRemind ? ` (${p.signal_date} 시그널)` : ''}
          </Text>
        );
      })}
    </View>
  );
};

const baseWrap = {
  borderWidth: 1,
  borderRadius: RADIUS_MD,
  padding: PADDING_SM,
  marginBottom: MARGIN_MD,
} as const;

const baseTitle = {
  fontSize: 13,
  fontWeight: '700' as const,
  marginBottom: 6,
};

const styles = StyleSheet.create({
  wrapRemind: {
    ...baseWrap,
    backgroundColor: COLOR_PRESETS.orangeBg,
    borderColor: COLOR_PRESETS.orangeBorder,
  },
  wrapNext: {
    ...baseWrap,
    backgroundColor: COLOR_PRESETS.accentBg,
    borderColor: COLOR_PRESETS.accentBorder,
  },
  titleRemind: {
    ...baseTitle,
    color: COLORS.orange,
  },
  titleNext: {
    ...baseTitle,
    color: COLORS.accent,
  },
  line: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 2,
  },
});
