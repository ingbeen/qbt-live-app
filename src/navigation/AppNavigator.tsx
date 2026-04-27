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

export const AppNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      header: () => <HomeHeader />,
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
      options={{
        tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
      }}
    />
    <Tab.Screen
      name="차트"
      component={ChartScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <ChartIcon color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="거래"
      component={TradeScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <TradeIcon color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="설정"
      component={SettingsScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <SettingsIcon color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);
