import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/colors';
import type {
  AssetId,
  BalanceAdjustHistory,
  FillHistory,
} from '../types/rtdb';
import type { SignalHistoryEntry } from '../services/rtdb';
import {
  directionLabel,
  formatShares,
  formatShortDate,
  formatUSD,
  formatUSDInt,
  toUpperTicker,
} from '../utils/format';
import { Badge } from './Badge';

interface Props {
  fills: FillHistory[] | null;
  balanceAdjusts: BalanceAdjustHistory[] | null;
  signals: SignalHistoryEntry[] | null;
}

type Filter = '전체' | '체결' | '보정' | '신호';

const FILTERS: readonly Filter[] = ['전체', '체결', '보정', '신호'];

type HistoryEvent =
  | { kind: 'fill'; date: string; sortKey: string; fill: FillHistory }
  | {
      kind: 'balance_adjust';
      date: string;
      sortKey: string;
      adjust: BalanceAdjustHistory;
    }
  | {
      kind: 'signal';
      date: string;
      sortKey: string;
      asset_id: AssetId;
      signal: SignalHistoryEntry['signal'];
    };

const buildHistoryTimeline = (
  fills: FillHistory[] | null,
  adjusts: BalanceAdjustHistory[] | null,
  signals: SignalHistoryEntry[] | null,
  filter: Filter,
): HistoryEvent[] => {
  const events: HistoryEvent[] = [];

  if ((filter === '전체' || filter === '체결') && fills) {
    fills.forEach((f) =>
      events.push({
        kind: 'fill',
        date: f.trade_date,
        sortKey: f.input_time_kst,
        fill: f,
      }),
    );
  }
  if ((filter === '전체' || filter === '보정') && adjusts) {
    adjusts.forEach((a) =>
      events.push({
        kind: 'balance_adjust',
        date: a.applied_at.slice(0, 10),
        sortKey: a.applied_at,
        adjust: a,
      }),
    );
  }
  if ((filter === '전체' || filter === '신호') && signals) {
    signals
      .filter((s) => s.signal.state !== 'none')
      .forEach((s) =>
        events.push({
          kind: 'signal',
          date: s.date,
          sortKey: s.date,
          asset_id: s.asset_id,
          signal: s.signal,
        }),
      );
  }

  events.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return events;
};

const renderFillContent = (f: FillHistory): string =>
  `${toUpperTicker(f.asset_id)} ${directionLabel(f.direction)} ${formatShares(
    f.actual_shares,
  )} ${formatUSD(f.actual_price)}`;

const renderAdjustContent = (a: BalanceAdjustHistory): string => {
  const parts: string[] = [];
  if (a.asset_id) {
    parts.push(toUpperTicker(a.asset_id));
    if (a.new_shares != null) parts.push(`주수→${a.new_shares}`);
    if (a.new_avg_price != null) parts.push(`평균가→${formatUSD(a.new_avg_price)}`);
    if (a.new_entry_date != null) parts.push(`진입일→${a.new_entry_date}`);
  }
  if (a.new_cash != null) parts.push(`현금→${formatUSDInt(a.new_cash)}`);
  return parts.join(', ') || '보정';
};

const renderSignalContent = (e: HistoryEvent & { kind: 'signal' }): string =>
  `${toUpperTicker(e.asset_id)} ${
    e.signal.state === 'buy' ? '매수' : '매도'
  } 시그널`;

const fillBarColor = (f: FillHistory): string =>
  f.direction === 'buy' ? COLORS.green : COLORS.red;

const fillTagBadge = (f: FillHistory): { text: string; color: string } | null => {
  if (f.reason === 'system_fill') return { text: '시스템', color: COLORS.green };
  if (f.reason === 'personal_trade') return { text: '개인', color: COLORS.red };
  return null;
};

export const HistoryList: React.FC<Props> = ({
  fills,
  balanceAdjusts,
  signals,
}) => {
  const [filter, setFilter] = useState<Filter>('전체');

  const events = useMemo(
    () => buildHistoryTimeline(fills, balanceAdjusts, signals, filter),
    [fills, balanceAdjusts, signals, filter],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>히스토리</Text>

      <View style={styles.chips}>
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {events.length === 0 ? (
        <Text style={styles.empty}>히스토리 없음</Text>
      ) : (
        events.map((e, idx) => {
          let barColor: string;
          let typeBadge: { text: string; color: string };
          let tagBadge: { text: string; color: string } | null = null;
          let content: string;

          if (e.kind === 'fill') {
            barColor = fillBarColor(e.fill);
            typeBadge = { text: '체결', color: COLORS.text };
            tagBadge = fillTagBadge(e.fill);
            content = renderFillContent(e.fill);
          } else if (e.kind === 'balance_adjust') {
            barColor = COLORS.yellow;
            typeBadge = { text: '보정', color: COLORS.yellow };
            content = renderAdjustContent(e.adjust);
          } else {
            barColor = COLORS.accent;
            typeBadge = { text: '신호', color: COLORS.accent };
            content = renderSignalContent(e);
          }

          return (
            <View key={`${e.kind}-${idx}-${e.sortKey}`} style={styles.row}>
              <Text style={styles.date}>{formatShortDate(e.date)}</Text>
              <View style={[styles.bar, { backgroundColor: barColor }]} />
              <View style={styles.contentCol}>
                <Text style={styles.content}>{content}</Text>
                <View style={styles.badges}>
                  <Badge text={typeBadge.text} color={typeBadge.color} />
                  {tagBadge ? (
                    <Badge text={tagBadge.text} color={tagBadge.color} />
                  ) : null}
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.sub,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.accent,
  },
  empty: {
    color: COLORS.sub,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
  },
  date: {
    color: COLORS.sub,
    fontSize: 11,
    width: 36,
    paddingTop: 2,
  },
  bar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  contentCol: {
    flex: 1,
  },
  content: {
    color: COLORS.text,
    fontSize: 12,
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
  },
});
