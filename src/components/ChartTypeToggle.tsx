import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
      <TouchableOpacity
        style={[styles.cell, isPrice && styles.cellActive]}
        onPress={() => onChange('price')}
        activeOpacity={0.7}
      >
        <Text style={[styles.cellText, isPrice && styles.cellTextActive]}>
          주가
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cell, isEquity && styles.cellActive]}
        onPress={() => onChange('equity')}
        activeOpacity={0.7}
      >
        <Text style={[styles.cellText, isEquity && styles.cellTextActive]}>
          Equity
        </Text>
      </TouchableOpacity>
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
