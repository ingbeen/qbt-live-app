import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, COLOR_PRESETS } from '../utils/colors';
import { ASSETS } from '../utils/constants';
import type { AssetId } from '../types/rtdb';
import { toUpperTicker } from '../utils/format';
import { pressedOpacity } from '../utils/pressable';

interface AssetSelectorProps {
  value: AssetId;
  onChange: (id: AssetId) => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  value,
  onChange,
}) => (
  <View style={styles.row}>
    {ASSETS.map((id) => {
      const isActive = value === id;
      return (
        <Pressable
          key={id}
          style={({ pressed }) => [
            styles.cell,
            isActive && styles.cellActive,
            pressedOpacity(pressed),
          ]}
          onPress={() => onChange(id)}
        >
          <Text style={[styles.cellText, isActive && styles.cellTextActive]}>
            {toUpperTicker(id)}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    backgroundColor: COLOR_PRESETS.accentMuted,
    borderColor: COLORS.accent,
  },
  cellText: {
    color: COLORS.sub,
    fontSize: 13,
    fontWeight: '600',
  },
  cellTextActive: {
    color: COLORS.accent,
  },
});
