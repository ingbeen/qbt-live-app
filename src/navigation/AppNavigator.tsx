import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

export const AppNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      header: renderHeader,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
        height: 64,
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
