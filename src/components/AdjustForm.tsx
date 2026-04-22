import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import { ASSET_TARGETS } from '../utils/constants';
import type {
  AssetId,
  BalanceAdjustPayload,
  Portfolio,
} from '../types/rtdb';
import {
  formatShares,
  formatUSDInt,
  kstNow,
  toUpperTicker,
  today,
} from '../utils/format';
import {
  toIsoDate,
  parseIntOrUndefined,
  parseFloatOrUndefined,
} from '../utils/parse';
import { validateBalanceAdjust } from '../utils/validation';
import { useStore } from '../store/useStore';

interface Props {
  portfolio: Portfolio;
}

type Target = AssetId | 'cash';

const targetLabel = (t: Target): string =>
  t === 'cash' ? '현금' : toUpperTicker(t);

export const AdjustForm: React.FC<Props> = ({ portfolio }) => {
  const submitBalanceAdjust = useStore((s) => s.submitBalanceAdjust);
  const lastError = useStore((s) => s.lastError);

  const [target, setTarget] = useState<Target | undefined>(undefined);
  const [sharesText, setSharesText] = useState('');
  const [priceText, setPriceText] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [cashText, setCashText] = useState('');
  const [reason, setReason] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetFields = useCallback(() => {
    setTarget(undefined);
    setSharesText('');
    setPriceText('');
    setEntryDate('');
    setCashText('');
    setReason('');
    setAttempted(false);
  }, []);

  const payload = useMemo<Partial<BalanceAdjustPayload>>(() => {
    if (target === 'cash') {
      return {
        new_cash: parseFloatOrUndefined(cashText),
        reason,
      };
    }
    if (target) {
      return {
        asset_id: target,
        new_shares: parseIntOrUndefined(sharesText),
        new_avg_price: parseFloatOrUndefined(priceText),
        new_entry_date: entryDate || undefined,
        reason,
      };
    }
    return { reason };
  }, [target, sharesText, priceText, entryDate, cashText, reason]);

  const result = useMemo(
    () => validateBalanceAdjust(payload, portfolio),
    [payload, portfolio],
  );

  const onPickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        setEntryDate(toIsoDate(selectedDate));
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
      const finalPayload: BalanceAdjustPayload = {
        ...payload,
        reason: reason || '수동 보정',
        input_time_kst: kstNow(),
      };
      await submitBalanceAdjust(finalPayload);
      resetFields();
    } catch {
      // store.lastError
    } finally {
      setSubmitting(false);
    }
  }, [payload, reason, result.valid, resetFields, submitBalanceAdjust]);

  const isAsset = target && target !== 'cash';
  const currentShares = isAsset
    ? portfolio.assets[target as AssetId].actual_shares
    : null;
  const currentCash = portfolio.shared_cash_actual;

  return (
    <View style={styles.wrap}>
      {lastError ? <Text style={styles.errorBanner}>{lastError}</Text> : null}
      {result.formError ? (
        <Text style={styles.errorBanner}>{result.formError}</Text>
      ) : null}

      <Text style={styles.label}>대상</Text>
      <View style={styles.row5}>
        {ASSET_TARGETS.map((t) => {
          const isActive = target === t;
          return (
            <Pressable
              key={t}
              style={({ pressed }) => [
                styles.cell,
                isActive && styles.cellActive,
                pressed && !submitting && { opacity: 0.7 },
              ]}
              onPress={() => setTarget(t)}
              disabled={submitting}
            >
              <Text
                style={[styles.cellText, isActive && styles.cellTextActive]}
              >
                {targetLabel(t)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {attempted && result.fieldErrors.asset_id ? (
        <Text style={styles.fieldError}>{result.fieldErrors.asset_id}</Text>
      ) : null}

      {isAsset ? (
        <>
          <Text style={styles.helpText}>
            현재: {formatShares(currentShares ?? 0)}
          </Text>
          <View style={styles.row3}>
            <View style={styles.col}>
              <Text style={styles.label}>새 주수</Text>
              <TextInput
                style={styles.input}
                placeholder="미변경"
                placeholderTextColor={COLORS.sub}
                keyboardType="numeric"
                value={sharesText}
                onChangeText={setSharesText}
                editable={!submitting}
              />
              {attempted && result.fieldErrors.new_shares ? (
                <Text style={styles.fieldError}>
                  {result.fieldErrors.new_shares}
                </Text>
              ) : null}
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>새 평균가 (USD)</Text>
              <TextInput
                style={styles.input}
                placeholder="미변경"
                placeholderTextColor={COLORS.sub}
                keyboardType="decimal-pad"
                value={priceText}
                onChangeText={setPriceText}
                editable={!submitting}
              />
              {attempted && result.fieldErrors.new_avg_price ? (
                <Text style={styles.fieldError}>
                  {result.fieldErrors.new_avg_price}
                </Text>
              ) : null}
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>새 진입일</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.dateButton,
                  pressed && !submitting && { opacity: 0.7 },
                ]}
                onPress={onOpenPicker}
                disabled={submitting}
              >
                <Text style={styles.dateText}>{entryDate || '미변경'}</Text>
              </Pressable>
              {attempted && result.fieldErrors.new_entry_date ? (
                <Text style={styles.fieldError}>
                  {result.fieldErrors.new_entry_date}
                </Text>
              ) : null}
            </View>
          </View>
          {showPicker ? (
            <DateTimePicker
              value={new Date((entryDate || today()) + 'T00:00:00+09:00')}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onPickerChange}
            />
          ) : null}
        </>
      ) : null}

      {target === 'cash' ? (
        <>
          <Text style={styles.helpText}>
            현재 현금: {formatUSDInt(currentCash)}
          </Text>
          <Text style={styles.label}>새 현금 (USD)</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 1500.00"
            placeholderTextColor={COLORS.sub}
            keyboardType="decimal-pad"
            value={cashText}
            onChangeText={setCashText}
            editable={!submitting}
          />
          {attempted && result.fieldErrors.new_cash ? (
            <Text style={styles.fieldError}>
              {result.fieldErrors.new_cash}
            </Text>
          ) : null}
        </>
      ) : null}

      <Text style={styles.label}>사유 (선택)</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 오프라인 매수 반영"
        placeholderTextColor={COLORS.sub}
        value={reason}
        onChangeText={setReason}
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
        <Text style={styles.primaryButtonText}>보정 저장</Text>
      </Pressable>
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
  label: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
  },
  row3: {
    flexDirection: 'row',
    gap: 6,
  },
  row5: {
    flexDirection: 'row',
    gap: 4,
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
  },
  cellActive: {
    backgroundColor: COLOR_PRESETS.accentMuted,
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
  dateButton: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
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
  helpText: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 8,
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
  buttonDisabled: {
    opacity: 0.4,
  },
});
