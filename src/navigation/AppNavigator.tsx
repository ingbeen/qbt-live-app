import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { TradeScreen } from '../screens/TradeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HomeHeader } from '../components/HomeHeader';
import { COLORS } from '../utils/colors';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      header: () => <HomeHeader />,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
      },
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: COLORS.sub,
    }}
  >
    <Tab.Screen name="홈" component={HomeScreen} />
    <Tab.Screen name="차트" component={ChartScreen} />
    <Tab.Screen name="거래" component={TradeScreen} />
    <Tab.Screen name="설정" component={SettingsScreen} />
  </Tab.Navigator>
);
