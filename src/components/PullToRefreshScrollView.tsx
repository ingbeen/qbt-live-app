import React from 'react';
import {
  ScrollView,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { COLORS } from '../utils/colors';

interface Props {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const PullToRefreshScrollView: React.FC<Props> = ({
  refreshing,
  onRefresh,
  children,
  contentContainerStyle,
}) => (
  <ScrollView
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={COLORS.accent}
        colors={[COLORS.accent]}
        progressBackgroundColor={COLORS.card}
      />
    }
    contentContainerStyle={contentContainerStyle}
    style={{ backgroundColor: COLORS.bg }}
  >
    {children}
  </ScrollView>
);
