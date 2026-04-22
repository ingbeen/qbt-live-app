import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import { ASSETS, SYMBOLS } from '../utils/constants';
import type { AssetId, PendingOrder, Signal } from '../types/rtdb';
import { directionLabel, toUpperTicker } from '../utils/format';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  pendingOrders: Partial<Record<AssetId, PendingOrder>> | null;
  signals: Record<AssetId, Signal> | null;
}

export const SyncDialog: React.FC<Props> = ({
  visible,
  onCancel,
  onConfirm,
  pendingOrders,
  signals,
}) => {
  const pendings = ASSETS.flatMap((id) => {
    const p = pendingOrders?.[id];
    return p ? [p] : [];
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Model 동기화</Text>
          <Text style={styles.body}>
            Model을 실제 기준으로 동기화합니다.
          </Text>

          {pendings.length > 0 && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingTitle}>
                {SYMBOLS.WARN} 체결 예정 주문이 있습니다:
              </Text>
              {pendings.map((p) => {
                const close = signals?.[p.asset_id]?.close;
                const sharesText =
                  close && close > 0
                    ? `${Math.round(Math.abs(p.delta_amount) / close)}주 `
                    : '';
                return (
                  <Text key={p.asset_id} style={styles.pendingLine}>
                    {toUpperTicker(p.asset_id)} {sharesText}
                    {directionLabel(p.delta_amount)} ({p.signal_date} 시그널)
                  </Text>
                );
              })}
              <Text style={styles.pendingNote}>
                동기화 시 이 주문은 취소되고,{'\n'}다음 실행에서 새로
                계산됩니다.
              </Text>
            </View>
          )}

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>동기화</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLOR_PRESETS.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: COLORS.sub,
    fontSize: 13,
    marginBottom: 16,
  },
  pendingBox: {
    backgroundColor: COLOR_PRESETS.orangeBg,
    borderColor: COLOR_PRESETS.orangeBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pendingTitle: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  pendingLine: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 2,
  },
  pendingNote: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  cancelText: {
    color: COLORS.sub,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
  },
  confirmText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
