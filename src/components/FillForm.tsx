import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { COLORS } from '../utils/colors';
import { ASSETS, SYMBOLS } from '../utils/constants';
import type {
  AssetId,
  Direction,
  FillPayload,
  PendingOrder,
  Portfolio,
  Signal,
} from '../types/rtdb';
import {
  directionLabel,
  formatShares,
  toUpperTicker,
  today,
} from '../utils/format';
import { validateFill } from '../utils/validation';
import { useStore } from '../store/useStore';

interface Props {
  portfolio: Portfolio;
  signals: Record<AssetId, Signal> | null;
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
}

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseIntOrUndefined = (s: string): number | undefined => {
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
};

const parseFloatOrUndefined = (s: string): number | undefined => {
  if (!s) return undefined;
  const n = parseFloat(s);
  return Number.isNaN(n) ? undefined : n;
};

export const FillForm: React.FC<Props> = ({
  portfolio,
  signals,
  pendingOrders,
}) => {
  const submitFill = useStore((s) => s.submitFill);
  const submitFillDismiss = useStore((s) => s.submitFillDismiss);
  const lastError = useStore((s) => s.lastError);

  const [assetId, setAssetId] = useState<AssetId | undefined>(undefined);
  const [direction, setDirection] = useState<Direction | undefined>(undefined);
  const [sharesText, setSharesText] = useState('');
  const [priceText, setPriceText] = useState('');
  const [tradeDate, setTradeDate] = useState(today());
  const [memo, setMemo] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const payload = useMemo<Partial<FillPayload>>(
    () => ({
      asset_id: assetId,
      direction,
      actual_shares: parseIntOrUndefined(sharesText),
      actual_price: parseFloatOrUndefined(priceText),
      trade_date: tradeDate,
      memo: memo || null,
    }),
    [assetId, direction, sharesText, priceText, tradeDate, memo],
  );

  const result = useMemo(
    () => validateFill(payload, portfolio),
    [payload, portfolio],
  );

  const pending = assetId ? pendingOrders?.[assetId] : undefined;
  const showSkipButton = !!pending;

  const onPickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        setTradeDate(toIsoDate(selectedDate));
      }
    },
    [],
  );

  const onOpenPicker = useCallback(() => setShowPicker(true), []);

  const onSubmit = useCallback(async () => {
    setAttempted(true);
    if (!result.valid) return;
    setSubmitting(true);
    try {
      await submitFill(payload as FillPayload);
      setSharesText('');
      setPriceText('');
      setMemo('');
      setAttempted(false);
    } catch {
      // store.lastError 가 채워짐
    } finally {
      setSubmitting(false);
    }
  }, [payload, result.valid, submitFill]);

  const onSkip = useCallback(async () => {
    if (!assetId) return;
    setSubmitting(true);
    try {
      await submitFillDismiss(assetId);
    } catch {
      // store.lastError
    } finally {
      setSubmitting(false);
    }
  }, [assetId, submitFillDismiss]);

  return (
    <View style={styles.wrap}>
      {lastError ? <Text style={styles.errorBanner}>{lastError}</Text> : null}

      {pending && signals?.[pending.asset_id] ? (
        <View style={styles.pendingHint}>
          <Text style={styles.pendingText}>
            {SYMBOLS.BOLT} {toUpperTicker(pending.asset_id)}{' '}
            {Math.round(
              Math.abs(pending.delta_amount) / signals[pending.asset_id].close,
            )}
            주 {directionLabel(pending.delta_amount)} pending
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>자산</Text>
      <View style={styles.row4}>
        {ASSETS.map((id) => {
          const isActive = assetId === id;
          const hasPending = !!pendingOrders?.[id];
          return (
            <Pressable
              key={id}
              style={({ pressed }) => [
                styles.cell,
                isActive && styles.cellActive,
                pressed && !submitting && { opacity: 0.7 },
              ]}
              onPress={() => setAssetId(id)}
              disabled={submitting}
            >
              <Text
                style={[styles.cellText, isActive && styles.cellTextActive]}
              >
                {toUpperTicker(id)}
              </Text>
              {hasPending ? (
                <Text style={styles.boltOverlay}>{SYMBOLS.BOLT}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {attempted && result.fieldErrors.asset_id ? (
        <Text style={styles.fieldError}>{result.fieldErrors.asset_id}</Text>
      ) : null}

      <Text style={styles.label}>방향</Text>
      <View style={styles.row2}>
        <Pressable
          style={({ pressed }) => [
            styles.cell,
            direction === 'buy' && {
              backgroundColor: COLORS.green + '22',
              borderColor: COLORS.green,
            },
            pressed && !submitting && { opacity: 0.7 },
          ]}
          onPress={() => setDirection('buy')}
          disabled={submitting}
        >
          <Text
            style={[
              styles.cellText,
              direction === 'buy' && { color: COLORS.green },
            ]}
          >
            매수
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.cell,
            direction === 'sell' && {
              backgroundColor: COLORS.red + '22',
              borderColor: COLORS.red,
            },
            pressed && !submitting && { opacity: 0.7 },
          ]}
          onPress={() => setDirection('sell')}
          disabled={submitting}
        >
          <Text
            style={[
              styles.cellText,
              direction === 'sell' && { color: COLORS.red },
            ]}
          >
            매도
          </Text>
        </Pressable>
      </View>
      {attempted && result.fieldErrors.direction ? (
        <Text style={styles.fieldError}>{result.fieldErrors.direction}</Text>
      ) : null}

      <View style={styles.row2}>
        <View style={styles.col}>
          <Text style={styles.label}>수량</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={COLORS.sub}
            keyboardType="numeric"
            value={sharesText}
            onChangeText={setSharesText}
            editable={!submitting}
          />
          {attempted && result.fieldErrors.actual_shares ? (
            <Text style={styles.fieldError}>
              {result.fieldErrors.actual_shares}
            </Text>
          ) : null}
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>체결가 (USD)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={COLORS.sub}
            keyboardType="decimal-pad"
            value={priceText}
            onChangeText={setPriceText}
            editable={!submitting}
          />
          {attempted && result.fieldErrors.actual_price ? (
            <Text style={styles.fieldError}>
              {result.fieldErrors.actual_price}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.label}>체결일</Text>
      <Pressable
        style={({ pressed }) => [
          styles.dateButton,
          pressed && !submitting && { opacity: 0.7 },
        ]}
        onPress={onOpenPicker}
        disabled={submitting}
      >
        <Text style={styles.dateText}>{tradeDate}</Text>
      </Pressable>
      {attempted && result.fieldErrors.trade_date ? (
        <Text style={styles.fieldError}>{result.fieldErrors.trade_date}</Text>
      ) : null}
      {showPicker ? (
        <DateTimePicker
          value={new Date(tradeDate + 'T00:00:00')}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={onPickerChange}
        />
      ) : null}

      <Text style={styles.label}>메모 (선택)</Text>
      <TextInput
        style={[styles.input, styles.memo]}
        placeholder="예: 시가 체결"
        placeholderTextColor={COLORS.sub}
        multiline
        value={memo}
        onChangeText={setMemo}
        editable={!submitting}
      />

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          (!result.valid || submitting) && styles.buttonDisabled,
          pressed && result.valid && !submitting && { opacity: 0.7 },
        ]}
        onPress={onSubmit}
        disabled={!result.valid || submitting}
      >
        <Text style={styles.primaryButtonText}>체결 저장</Text>
      </Pressable>

      {showSkipButton ? (
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            submitting && styles.buttonDisabled,
            pressed && !submitting && { opacity: 0.7 },
          ]}
          onPress={onSkip}
          disabled={submitting}
        >
          <Text style={styles.secondaryButtonText}>이 시그널 스킵</Text>
        </Pressable>
      ) : null}

      {portfolio.assets[assetId ?? 'sso'] && assetId ? (
        <Text style={styles.helpText}>
          현재 보유: {formatShares(portfolio.assets[assetId].actual_shares)}
        </Text>
      ) : null}
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
    marginBottom: 12,
  },
  errorBanner: {
    color: COLORS.red,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  pendingHint: {
    backgroundColor: COLORS.accent + '1e',
    borderColor: COLORS.accent + '55',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  pendingText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
  },
  row4: {
    flexDirection: 'row',
    gap: 6,
  },
  row2: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderColor: COLORS.border,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  cellActive: {
    backgroundColor: COLORS.accent + '22',
    borderColor: COLORS.accent,
  },
  cellText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  cellTextActive: {
    color: COLORS.accent,
  },
  boltOverlay: {
    position: 'absolute',
    top: 2,
    right: 4,
    color: COLORS.accent,
    fontSize: 10,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  memo: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 13,
  },
  fieldError: {
    color: COLORS.red,
    fontSize: 11,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: COLORS.sub,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  helpText: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});
