import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { TradeScreen } from '../screens/TradeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HomeHeader } from '../components/HomeHeader';
import {
  HomeIcon,
  ChartIcon,
  TradeIcon,
  SettingsIcon,
} from '../components/TabIcons';
import { COLORS } from '../utils/colors';

const Tab = createBottomTabNavigator();

// 모듈 스코프 정의: 매 렌더마다 새 컴포넌트 타입이 생성되지 않도록
// (react/no-unstable-nested-components 회피, CLAUDE.md §5.4).
interface TabBarIconProps {
  color: string;
  size: number;
}

const renderHeader = (): React.ReactElement => <HomeHeader />;
const renderHomeIcon = ({
  color,
  size,
}: TabBarIconProps): React.ReactElement => <HomeIcon color={color} size={size} />;
const renderChartIcon = ({
  color,
  size,
}: TabBarIconProps): React.ReactElement => (
  <ChartIcon color={color} size={size} />
);
const renderTradeIcon = ({
  color,
  size,
}: TabBarIconProps): React.ReactElement => (
  <TradeIcon color={color} size={size} />
);
const renderSettingsIcon = ({
  color,
  size,
}: TabBarIconProps): React.ReactElement => (
  <SettingsIcon color={color} size={size} />
);

// 탭바 본체 높이 (시스템 nav bar inset 제외 순수 탭 영역).
const TAB_BAR_BASE_HEIGHT = 54;

export const AppNavigator: React.FC = () => {
  // 시스템 네비게이션 바(3버튼 / 제스처 인디케이터) 영역만큼 하단 inset 을 더해
  // 탭바 라벨이 시스템 영역과 겹치지 않도록 한다.
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        header: renderHeader,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.sub,
      }}
    >
      <Tab.Screen
        name="홈"
        component={HomeScreen}
        options={{ tabBarIcon: renderHomeIcon }}
      />
      <Tab.Screen
        name="차트"
        component={ChartScreen}
        options={{ tabBarIcon: renderChartIcon }}
      />
      <Tab.Screen
        name="거래"
        component={TradeScreen}
        options={{ tabBarIcon: renderTradeIcon }}
      />
      <Tab.Screen
        name="설정"
        component={SettingsScreen}
        options={{ tabBarIcon: renderSettingsIcon }}
      />
    </Tab.Navigator>
  );
};
