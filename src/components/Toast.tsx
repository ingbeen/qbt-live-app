import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../utils/colors';
import {
  PADDING_SM,
  RADIUS_MD,
  SYMBOLS,
  TOAST_AUTO_HIDE_MS,
} from '../utils/constants';
import { pressedOpacity } from '../utils/pressable';

interface Props {
  message: string | null;
  onClose: () => void;
  autoHideMs?: number;
}

export const Toast: React.FC<Props> = ({
  message,
  onClose,
  autoHideMs = TOAST_AUTO_HIDE_MS,
}) => {
  // message 값이 달라질 때마다 타이머 재장전. 동일 문자열이 연속 set 되면 effect 는 재실행되지
  // 않지만, 이전 타이머가 만료되며 자연히 hide → 다시 set 되므로 UX 상 문제가 되지 않는다.
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [message, autoHideMs, onClose]);

  if (!message) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.close, pressedOpacity(pressed)]}
      >
        <Text style={styles.closeText}>{SYMBOLS.CLOSE}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 25,
    backgroundColor: COLORS.toastBg,
    borderColor: COLORS.toastBorder,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    padding: PADDING_SM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.6,
    elevation: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: COLORS.toastText,
    fontWeight: '500',
    lineHeight: 18,
  },
  close: {
    marginLeft: 10,
    paddingHorizontal: 4,
  },
  closeText: {
    color: COLORS.toastClose,
    fontSize: 16,
  },
});
