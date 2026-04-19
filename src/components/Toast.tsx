import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/colors';
import { SYMBOLS } from '../utils/constants';

interface Props {
  message: string | null;
  onClose: () => void;
  autoHideMs?: number;
}

export const Toast: React.FC<Props> = ({
  message,
  onClose,
  autoHideMs = 3000,
}) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [message, autoHideMs, onClose]);

  if (!message) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity
        onPress={onClose}
        style={styles.close}
        activeOpacity={0.7}
      >
        <Text style={styles.closeText}>{SYMBOLS.CLOSE}</Text>
      </TouchableOpacity>
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
    borderRadius: 8,
    padding: 12,
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
