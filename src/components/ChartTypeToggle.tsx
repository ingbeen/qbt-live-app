import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

export type ChartType = 'price' | 'equity';

interface ChartTypeToggleProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
}

export const ChartTypeToggle: React.FC<ChartTypeToggleProps> = ({
  value,
  onChange,
}) => {
  const isPrice = value === 'price';
  const isEquity = value === 'equity';
  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [
          styles.cell,
          isPrice && styles.cellActive,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => onChange('price')}
      >
        <Text style={[styles.cellText, isPrice && styles.cellTextActive]}>
          주가
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.cell,
          isEquity && styles.cellActive,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => onChange('equity')}
      >
        <Text style={[styles.cellText, isEquity && styles.cellTextActive]}>
          Equity
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  cellText: {
    color: COLORS.sub,
    fontSize: 14,
    fontWeight: '600',
  },
  cellTextActive: {
    color: COLORS.text,
  },
});
