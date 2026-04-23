import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../utils/colors';
import { ASSETS, CASH_DIFF_THRESHOLD_USD, SYMBOLS } from '../utils/constants';
import type { Portfolio } from '../types/rtdb';
import {
  formatDriftPct,
  formatSignedInt,
  formatUSDInt,
  toUpperTicker,
} from '../utils/format';

interface Props {
  portfolio: Portfolio;
  onSyncPress: () => void;
}

export const ModelCompareCard: React.FC<Props> = ({
  portfolio,
  onSyncPress,
}) => {
  const [expanded, setExpanded] = useState(false);

  const onToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const cashDiff = portfolio.shared_cash_model - portfolio.shared_cash_actual;
  const cashDiffColor =
    Math.abs(cashDiff) >= CASH_DIFF_THRESHOLD_USD ? COLORS.yellow : COLORS.sub;

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [
          styles.headerRow,
          pressed && { opacity: 0.7 },
        ]}
        onPress={onToggle}
      >
        <Text style={styles.title}>Model 비교</Text>
        <View style={styles.headerRight}>
          <Text style={styles.driftBadge}>
            Drift {formatDriftPct(portfolio.drift_pct)}
          </Text>
          <Text style={styles.arrow}>
            {expanded ? SYMBOLS.ARROW_UP : SYMBOLS.ARROW_DOWN}
          </Text>
        </View>
      </Pressable>

      {expanded && (
        <>
          <View style={styles.divider} />
          <View style={styles.totalsRow}>
            <View style={styles.totalsCol}>
              <Text style={styles.totalsLabel}>Model</Text>
              <Text style={styles.totalsValue}>
                {formatUSDInt(portfolio.model_equity)}
              </Text>
            </View>
            <View style={styles.totalsCol}>
              <Text style={styles.totalsLabel}>Actual</Text>
              <Text style={styles.totalsValue}>
                {formatUSDInt(portfolio.actual_equity)}
              </Text>
            </View>
            <View style={styles.totalsCol}>
              <Text style={styles.totalsLabel}>Drift</Text>
              <Text style={styles.totalsValue}>
                {formatDriftPct(portfolio.drift_pct)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {ASSETS.map((id) => {
            const snap = portfolio.assets[id];
            const diff = snap.model_shares - snap.actual_shares;
            const diffColor = diff !== 0 ? COLORS.yellow : COLORS.sub;
            return (
              <View key={id} style={styles.assetRow}>
                <Text style={styles.assetTicker}>{toUpperTicker(id)}</Text>
                <Text style={styles.assetCompare}>
                  M:{snap.model_shares} / A:{snap.actual_shares}
                  {diff !== 0 ? ' ' : ''}
                  <Text style={{ color: diffColor }}>{formatSignedInt(diff)}</Text>
                </Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          <View style={styles.assetRow}>
            <Text style={styles.assetTicker}>현금</Text>
            <Text style={styles.assetCompare}>
              M:{formatUSDInt(portfolio.shared_cash_model)} / A:
              {formatUSDInt(portfolio.shared_cash_actual)}
              {cashDiff !== 0 ? ' ' : ''}
              <Text style={{ color: cashDiffColor }}>
                {formatSignedInt(Math.round(cashDiff))}
              </Text>
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.syncButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onSyncPress}
          >
            <Text style={styles.syncButtonText}>Model을 실제로 동기화</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  driftBadge: {
    color: COLORS.sub,
    fontSize: 12,
  },
  arrow: {
    color: COLORS.sub,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalsCol: {
    flex: 1,
  },
  totalsLabel: {
    color: COLORS.sub,
    fontSize: 11,
    marginBottom: 2,
  },
  totalsValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  assetTicker: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  assetCompare: {
    color: COLORS.text,
    fontSize: 12,
  },
  syncButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
