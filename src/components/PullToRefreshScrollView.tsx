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
  // ScrollView 자체의 style. 부모가 flex 컨테이너인 경우 호출부에서
  // flexGrow / flex 등을 명시 가능. 기본 배경색은 COLORS.bg 로 유지.
  style?: StyleProp<ViewStyle>;
}

export const PullToRefreshScrollView: React.FC<Props> = ({
  refreshing,
  onRefresh,
  children,
  contentContainerStyle,
  style,
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
    style={[{ backgroundColor: COLORS.bg }, style]}
    keyboardShouldPersistTaps="handled"
  >
    {children}
  </ScrollView>
);
