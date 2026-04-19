import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  text: string;
  color: string;
}

export const Badge: React.FC<BadgeProps> = ({ text, color }) => (
  <View style={[styles.wrap, { backgroundColor: color + '22' }]}>
    <Text style={[styles.text, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
  },
});
